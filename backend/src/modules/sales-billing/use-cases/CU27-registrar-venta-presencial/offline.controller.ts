import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { PresentialSaleService } from './presential-sale.service.js';
import { CreatePresentialSaleDto } from './dto/create-presential-sale.dto.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/** Contrato v1 para clientes web y móvil; requiere instalar offline-schema.sql por tenant. */
@Controller('sales-billing/pos/offline')
@UseGuards(JwtAuthGuard)
export class OfflineController {
  constructor(private readonly prisma: PrismaService, private readonly pos: PresentialSaleService) {}

  @Get('catalog')
  async catalog(@Req() req: any, @Query('branch') branch: string, @Query('terminal') terminal: string) {
    return this.prepare(req, { branch: Number(branch), terminal, catalogOnly: true });
  }

  private admin(req: any) {
    if (req.user.id_rol !== 1 && String(req.user.rol).toLowerCase() !== 'administrador') throw new ForbiddenException('La conciliación requiere un administrador de esta tienda');
  }

  @Get('incidents')
  async incidents(@Req() req: any) {
    this.admin(req);
    return this.prisma.$queryRaw<any[]>`SELECT o.id, o.user_id, o.payload, o.response, o.created_at, p.branch_id, p.terminal FROM offline_operation o JOIN offline_preparation p ON p.id = o.preparation_id WHERE o.response->>'status' = 'REVIEW' ORDER BY o.created_at LIMIT 200`;
  }

  @Post('recover')
  async recover(@Req() req: any, @Body() body: { operation: any; note: string }) {
    this.admin(req);
    if (!body?.operation || !/^[0-9a-f-]{36}$/i.test(body.operation.preparationId) || typeof body.note !== 'string' || body.note.trim().length < 10 || body.note.length > 2000) throw new BadRequestException('Se requiere una operación respaldada y una justificación');
    const preparations = await this.prisma.$queryRaw<any[]>`SELECT user_id FROM offline_preparation WHERE id = ${body.operation.preparationId}::uuid`;
    if (!preparations.length) throw new BadRequestException('Preparación desconocida en esta tienda');
    // Recuperar evidencia no equivale a autorizar otra venta ni a suplantar el acceso del cajero.
    return this.sync({ user: { id_usuario: preparations[0].user_id } }, body.operation, { id: req.user.id_usuario, note: body.note.trim() });
  }

  @Post('operations/:id/resolve')
  async resolve(@Req() req: any, @Param('id') id: string, @Body() body: { note: string }) {
    this.admin(req);
    if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body?.note !== 'string' || body.note.trim().length < 10 || body.note.length > 2000) throw new BadRequestException('Se requiere UUID y una justificación de al menos 10 caracteres');
    return this.prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
      const rows = await tx.$queryRaw<any[]>`SELECT o.*, p.catalog, p.branch_id, p.session_id, p.created_at AS prepared_at, p.expires_at FROM offline_operation o JOIN offline_preparation p ON p.id = o.preparation_id WHERE o.id = ${id}::uuid FOR UPDATE OF o`;
      const operation = rows[0];
      if (!operation) throw new BadRequestException('Operación inexistente');
      if (operation.response.status === 'CONFIRMED') return operation.response;
      if (operation.session_id) {
        const sessions = await tx.$queryRaw<any[]>`SELECT closed_at FROM offline_cash_session WHERE id = ${operation.session_id}::uuid FOR UPDATE`;
        if (!sessions.length || sessions[0].closed_at) throw new BadRequestException('El turno está cerrado');
      }
      const payload = operation.payload;
      const occurredAt = Date.parse(payload.createdAt);
      if (!Number.isFinite(occurredAt) || occurredAt < new Date(operation.prepared_at).getTime() || occurredAt > new Date(operation.expires_at).getTime()) throw new BadRequestException('La fecha no corresponde al periodo autorizado; requiere investigación y regularización contable externa');
      const prices = new Map<number, { regular: number; final: number }>();
      for (const item of payload.items) {
        const variant = operation.catalog.flatMap((p: any) => p.variantes).find((v: any) => v.id_producto_variante === item.variant);
        if (!variant || Math.round(variant.precio_final * 100) !== item.priceMinor) throw new BadRequestException('El precio registrado no coincide con el catálogo autorizado');
        prices.set(item.variant, { regular: variant.precio_regular, final: variant.precio_final });
      }
      const employee = await tx.empleado.findUnique({ where: { id_empleado: operation.user_id } });
      if (!employee) throw new BadRequestException('El cajero original no tiene ficha de empleado. No se sustituirá por otro empleado');
      await tx.$executeRawUnsafe('LOCK TABLE venta, detalle_venta, pago, movimiento_inventario IN SHARE ROW EXCLUSIVE MODE');
      const dto = plainToInstance(CreatePresentialSaleDto, { id_sucursal: operation.branch_id, metodo_pago: 'efectivo', monto_recibido: payload.receivedMinor / 100, items: payload.items.map((i: any) => ({ id_producto_variante: i.variant, cantidad: i.quantity })), transaccion_externa: id, id_cliente: payload.customer?.id, cliente_ci: payload.customer?.ci, cliente_nombre: payload.customer?.name, nit_factura: payload.customer?.nit, razon_social_factura: payload.customer?.businessName, cliente_telefono: payload.customer?.phone });
      const receipt = await this.pos.registerPresentialSale(req.user, dto, undefined, tx, { prices, employee: employee.id_empleado, occurredAt: payload.createdAt });
      const response = { id, status: 'CONFIRMED', result: receipt };
      const audit = randomUUID();
      await tx.$executeRaw`INSERT INTO offline_resolution (id, operation_id, user_id, action, note, before_response, after_response) VALUES (${audit}::uuid, ${id}::uuid, ${req.user.id_usuario}, 'APROBAR_PRECIO_PREPARADO', ${body.note.trim()}, ${JSON.stringify(operation.response)}::jsonb, ${JSON.stringify(response)}::jsonb)`;
      await tx.$executeRaw`UPDATE offline_operation SET response = ${JSON.stringify(response)}::jsonb WHERE id = ${id}::uuid`;
      return response;
    }, { timeout: 30000 });
  }

  @Get('cash/:id')
  async cash(@Req() req: any, @Param('id') id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('UUID inválido');
    const rows = await this.prisma.$queryRaw<any[]>`SELECT id, user_id, branch_id, initial_minor, opened_at, closed_at, counted_minor, expected_minor::text, difference_minor::text FROM offline_cash_session WHERE id = ${id}::uuid`;
    if (!rows.length) throw new BadRequestException('Turno inexistente');
    if (rows[0].user_id !== req.user.id_usuario) this.admin(req);
    const operations = await this.prisma.$queryRaw<any[]>`SELECT o.id FROM offline_operation o JOIN offline_preparation p ON p.id = o.preparation_id WHERE p.session_id = ${id}::uuid ORDER BY o.id`;
    return { ...rows[0], operationIds: operations.map(operation => operation.id) };
  }

  @Post('cash/:id/close')
  async closeCash(@Req() req: any, @Param('id') id: string, @Body() body: { countedMinor: number; operationIds: string[]; note?: string }) {
    if (!/^[0-9a-f-]{36}$/i.test(id) || !body || !Number.isSafeInteger(body.countedMinor) || body.countedMinor < 0 || body.countedMinor > 2147483647 || !Array.isArray(body.operationIds) || body.operationIds.length > 10000 || body.operationIds.some(operation => typeof operation !== 'string' || !/^[0-9a-f-]{36}$/i.test(operation)) || new Set(body.operationIds).size !== body.operationIds.length) throw new BadRequestException('Arqueo o manifiesto inválido');
    const manifest = JSON.stringify([...body.operationIds].sort());
    return this.prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<any[]>`SELECT * FROM offline_cash_session WHERE id = ${id}::uuid FOR UPDATE`;
      const session = rows[0];
      if (!session) throw new BadRequestException('Turno inexistente');
      if (session.user_id !== req.user.id_usuario) {
        this.admin(req);
        if (typeof body.note !== 'string' || body.note.trim().length < 10 || body.note.length > 2000) throw new BadRequestException('El cierre administrativo requiere justificar la verificación de todas las operaciones y del efectivo');
      }
      if (session.closed_at) {
        if (session.counted_minor !== body.countedMinor || JSON.stringify(session.closing_manifest) !== manifest) throw new BadRequestException('Este turno ya se cerró con otro arqueo');
        return { id, closed: true, expectedMinor: Number(session.expected_minor), differenceMinor: Number(session.difference_minor) };
      }
      const operations = await tx.$queryRaw<any[]>`SELECT o.id, o.payload, o.response FROM offline_operation o JOIN offline_preparation p ON p.id = o.preparation_id WHERE p.session_id = ${id}::uuid ORDER BY o.id`;
      if (JSON.stringify(operations.map(operation => operation.id).sort()) !== manifest || operations.some(operation => operation.response.status !== 'CONFIRMED')) throw new BadRequestException('Hay ventas sin recibir o sin conciliar. Sincroniza y resuelve las incidencias antes del cierre');
      const expected = session.initial_minor + operations.reduce((sum, operation) => sum + operation.payload.items.reduce((total: number, item: any) => total + item.quantity * item.priceMinor, 0), 0);
      if (!Number.isSafeInteger(expected)) throw new BadRequestException('El importe de caja excede el límite admitido');
      const difference = body.countedMinor - expected;
      await tx.$executeRaw`UPDATE offline_cash_session SET closed_at = now(), counted_minor = ${body.countedMinor}, expected_minor = ${expected}::bigint, difference_minor = ${difference}::bigint, closing_manifest = ${manifest}::jsonb, closed_by = ${req.user.id_usuario} WHERE id = ${id}::uuid`;
      if (body.note) await tx.$executeRaw`UPDATE offline_cash_session SET closing_note = ${body.note.slice(0, 2000)} WHERE id = ${id}::uuid`;
      await tx.$executeRaw`UPDATE offline_preparation SET expires_at = LEAST(expires_at, now()) WHERE session_id = ${id}::uuid`;
      return { id, closed: true, expectedMinor: expected, differenceMinor: difference };
    });
  }

  @Post('prepare')
  async prepare(@Req() req: any, @Body() body: { branch: number; terminal: string; initialMinor?: number; catalogOnly?: boolean }) {
    if (!Number.isSafeInteger(body.branch) || typeof body.terminal !== 'string' || !/^[\w-]{1,100}$/.test(body.terminal)) throw new BadRequestException('Terminal o sucursal inválida');
    if (req.user.id_rol !== 1 && req.user.rol?.toLowerCase() !== 'administrador') {
      const assignment = await this.prisma.empleado_sucursal.findFirst({ where: { id_empleado: req.user.id_usuario, id_sucursal: body.branch } });
      if (!assignment) throw new BadRequestException('Sin asignación explícita a esta sucursal');
    }
    const branches = await this.pos.getCashierBranches(req.user);
    if (!branches.some(b => b.id_sucursal === body.branch)) throw new BadRequestException('Sucursal no autorizada');
    const products = await this.pos.getPOSProducts({ id_sucursal: body.branch }, true);
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 8 * 3600_000);
    if (body.catalogOnly !== undefined && typeof body.catalogOnly !== 'boolean') throw new BadRequestException('Modo de preparación inválido');
    // La descarga automática del catálogo no abre una caja ni fija un fondo inicial.
    if (body.catalogOnly) return { version: 1, id, expiresAt, products, branches, catalogOnly: true, sessionId: null, initialMinor: 0 };
    const initial = body.initialMinor ?? 0;
    if (!Number.isSafeInteger(initial) || initial < 0 || initial > 2147483647) throw new BadRequestException('Fondo inicial inválido');
    const sessionId = await this.prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(98231, ${body.branch}::integer)`;
      const active = await tx.$queryRaw<any[]>`SELECT id FROM offline_preparation WHERE branch_id = ${body.branch} AND expires_at > now() AND (terminal <> ${body.terminal} OR user_id <> ${req.user.id_usuario}) LIMIT 1`;
      if (active.length) throw new BadRequestException('Esta sucursal ya tiene otra terminal o usuario preparado. Espera a que finalice su autorización offline.');
      const sessions = await tx.$queryRaw<any[]>`SELECT * FROM offline_cash_session WHERE branch_id = ${body.branch} AND closed_at IS NULL FOR UPDATE`;
      const current = sessions[0];
      if (current && (current.user_id !== req.user.id_usuario || current.terminal !== body.terminal)) throw new BadRequestException('Existe un turno abierto de otra terminal. Debe conciliarse antes de abrir uno nuevo.');
      const session = current?.id ?? randomUUID();
      if (!current) await tx.$executeRaw`INSERT INTO offline_cash_session (id, user_id, branch_id, terminal, initial_minor) VALUES (${session}::uuid, ${req.user.id_usuario}, ${body.branch}, ${body.terminal}, ${initial})`;
      await tx.$executeRaw`INSERT INTO offline_preparation (id, user_id, branch_id, terminal, expires_at, catalog, session_id) VALUES (${id}::uuid, ${req.user.id_usuario}, ${body.branch}, ${body.terminal}, ${expiresAt}, ${JSON.stringify(products)}::jsonb, ${session}::uuid)`;
      return { id: session, initialMinor: current?.initial_minor ?? initial };
    });
    return { version: 1, id, expiresAt, products, branches, sessionId: sessionId.id, initialMinor: sessionId.initialMinor };
  }

  @Get('operations/:id')
  async result(@Req() req: any, @Param('id') id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('UUID inválido');
    const rows = await this.prisma.$queryRaw<any[]>`SELECT response FROM offline_operation WHERE id = ${id}::uuid AND user_id = ${req.user.id_usuario}`;
    return rows[0]?.response ?? { id, status: 'PENDING' };
  }

  @Post('sync')
  async sync(@Req() req: any, @Body() body: any, recoveryActor?: { id: number; note: string }) {
    if (!body || !/^[0-9a-f-]{36}$/i.test(body.id) || !/^[0-9a-f-]{36}$/i.test(body.preparationId) || !Array.isArray(body.items) || !body.items.length || body.items.length > 100 || !Number.isSafeInteger(body.receivedMinor)) throw new BadRequestException('Operación inválida');
    if (body.items.some((item: unknown) => !item || typeof item !== 'object')) throw new BadRequestException('Detalle inválido');
    if (body.customer && (typeof body.customer !== 'object' || Array.isArray(body.customer))) throw new BadRequestException('Cliente inválido');
    const customer = body.customer ? { id: body.customer.id, ci: body.customer.ci, name: body.customer.name, nit: body.customer.nit, businessName: body.customer.businessName, phone: body.customer.phone } : undefined;
    if (customer && (customer.id !== undefined && (!Number.isSafeInteger(customer.id) || customer.id <= 0) || [customer.ci, customer.name, customer.nit, customer.businessName, customer.phone].some(value => value !== undefined && (typeof value !== 'string' || value.length > 200)))) throw new BadRequestException('Datos de cliente inválidos');
    const items = body.items.map((item: any) => ({ variant: item.variant, quantity: item.quantity, priceMinor: item.priceMinor }));
    if (items.some((i: any) => !Number.isSafeInteger(i.variant) || i.variant <= 0 || !Number.isSafeInteger(i.quantity) || i.quantity <= 0 || !Number.isSafeInteger(i.priceMinor) || i.priceMinor < 0)) throw new BadRequestException('Detalle inválido');
    const canonical = JSON.stringify({ preparationId: body.preparationId, createdAt: body.createdAt, receivedMinor: body.receivedMinor, items, customer });
    const hash = createHash('sha256').update(canonical).digest('hex');
    return this.prisma.$transaction(async (tx) => {
      // Serializa reintentos de la misma operación antes de consultar su resultado.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${body.id}, 0))`;
      const existing = await tx.$queryRaw<any[]>`SELECT payload_hash, response, user_id FROM offline_operation WHERE id = ${body.id}::uuid`;
      if (existing[0]) {
        if (existing[0].user_id !== req.user.id_usuario || existing[0].payload_hash !== hash) throw new BadRequestException('La clave ya existe con otro contenido o usuario');
        return existing[0].response;
      }
      const preparations = await tx.$queryRaw<any[]>`SELECT * FROM offline_preparation WHERE id = ${body.preparationId}::uuid AND user_id = ${req.user.id_usuario}`;
      const preparation = preparations[0];
      if (!preparation) throw new BadRequestException('Preparación no autorizada');
      if (preparation.session_id) {
        const sessions = await tx.$queryRaw<any[]>`SELECT closed_at FROM offline_cash_session WHERE id = ${preparation.session_id}::uuid FOR UPDATE`;
        if (!sessions.length || sessions[0].closed_at) throw new BadRequestException('El turno está cerrado. Solicita recuperación administrativa de esta operación.');
      }
      const total = items.reduce((sum: number, i: any) => sum + i.quantity * i.priceMinor, 0);
      if (!Number.isSafeInteger(total) || body.receivedMinor < total) throw new BadRequestException('Importes inválidos');
      const occurredAt = Date.parse(body.createdAt);
      let response: any;
      const pricesValid = items.every((item: any) => preparation.catalog.some((p: any) => p.variantes.some((v: any) => v.id_producto_variante === item.variant && Math.round(v.precio_final * 100) === item.priceMinor)));
      if (recoveryActor) {
        response = { id: body.id, status: 'REVIEW', result: { code: 'RECUPERACION_ADMINISTRATIVA', totalMinor: total } };
      } else if (!Number.isFinite(occurredAt) || occurredAt < new Date(preparation.created_at).getTime() || occurredAt > new Date(preparation.expires_at).getTime() || !pricesValid) {
        response = { id: body.id, status: 'REVIEW', result: { code: 'PREPARACION_INVALIDA', totalMinor: total } };
      } else {
        await tx.$executeRawUnsafe('SAVEPOINT offline_sale');
        try {
          // Los módulos actuales asignan IDs manualmente; bloquear escritores evita colisiones
          // en este flujo hasta completar la migración global de identificadores.
          await tx.$executeRawUnsafe('LOCK TABLE venta, detalle_venta, pago, movimiento_inventario IN SHARE ROW EXCLUSIVE MODE');
          const dto = plainToInstance(CreatePresentialSaleDto, { id_sucursal: preparation.branch_id, metodo_pago: 'efectivo', monto_recibido: body.receivedMinor / 100, items: items.map((i: any) => ({ id_producto_variante: i.variant, cantidad: i.quantity })), transaccion_externa: body.id, id_cliente: customer?.id, cliente_ci: customer?.ci, cliente_nombre: customer?.name, nit_factura: customer?.nit, razon_social_factura: customer?.businessName, cliente_telefono: customer?.phone });
          if ((await validate(dto)).length) throw new BadRequestException('Venta inválida');
          const receipt = await this.pos.registerPresentialSale(req.user, dto, undefined, tx, undefined, body.createdAt);
          if (Math.round(receipt.liquidacion.total * 100) !== total || receipt.items.some((item: any, index: number) => Math.round(item.precio_unitario * 100) !== items[index].priceMinor)) throw new BadRequestException('El precio cambió y requiere conciliación');
          response = { id: body.id, status: 'CONFIRMED', result: receipt };
          await tx.$executeRawUnsafe('RELEASE SAVEPOINT offline_sale');
        } catch (error) {
          await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT offline_sale');
          response = { id: body.id, status: 'REVIEW', result: { code: 'VENTA_REQUIERE_CONCILIACION', message: error instanceof BadRequestException ? error.message : 'No se pudo aplicar la venta; revisar antes de conciliar', totalMinor: total } };
        }
      }
      await tx.$executeRaw`INSERT INTO offline_operation (id, preparation_id, user_id, payload_hash, payload, response) VALUES (${body.id}::uuid, ${body.preparationId}::uuid, ${req.user.id_usuario}, ${hash}, ${canonical}::jsonb, ${JSON.stringify(response)}::jsonb)`;
      if (recoveryActor) {
        const audit = randomUUID();
        await tx.$executeRaw`INSERT INTO offline_resolution (id, operation_id, user_id, action, note, before_response, after_response) VALUES (${audit}::uuid, ${body.id}::uuid, ${recoveryActor.id}, 'RECUPERAR_COLA', ${recoveryActor.note}, '{"status":"PENDING"}'::jsonb, ${JSON.stringify(response)}::jsonb)`;
      }
      return response;
    }, { timeout: 30000 });
  }
}
