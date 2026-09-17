import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import { CreatePresentialSaleDto } from './dto/create-presential-sale.dto.js';
import { QueryPOSProductsDto } from './dto/query-pos-products.dto.js';

@Injectable()
export class PresentialSaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  /**
   * Obtiene la lista de sucursales habilitadas para el cajero o administrador
   */
  async getCashierBranches(user: any) {
    const userId = Number(user?.id_usuario ?? user?.sub);
    const rolNorm = (user?.rol || user?.rol?.nombre || '').toLowerCase().trim();
    const isAdmin = user?.id_rol === 1 || rolNorm === 'administrador';

    if (isAdmin) {
      return this.prisma.sucursal.findMany({
        where: { estado: 'activo' },
        include: { ciudad: true },
        orderBy: { nombre: 'asc' },
      });
    }

    // Si es cajero o empleado, obtener sus sucursales asignadas
    const asignaciones = await this.prisma.empleado_sucursal.findMany({
      where: { id_empleado: userId },
      include: {
        sucursal: {
          include: { ciudad: true },
        },
      },
      orderBy: {
        sucursal: { nombre: 'asc' },
      },
    });

    if (asignaciones.length > 0) {
      return asignaciones.map((a) => a.sucursal);
    }

    // Si no tiene asignación explícita, devolver la primera sucursal activa como fallback
    return this.prisma.sucursal.findMany({
      where: { estado: 'activo' },
      include: { ciudad: true },
      take: 1,
    });
  }

  /**
   * Obtiene el catálogo de productos con variantes y existencias en la sucursal seleccionada
   */
  async getPOSProducts(query: QueryPOSProductsDto) {
    const { id_sucursal, search, id_categoria } = query;
    const now = new Date();

    const whereClause: any = {
      estado: 'activo',
    };

    if (id_categoria) {
      whereClause.id_categoria = Number(id_categoria);
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
        {
          producto_variante: {
            some: {
              sku: { contains: q, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const productos = await this.prisma.producto.findMany({
      where: whereClause,
      include: {
        categoria: true,
        imagen_producto: {
          orderBy: { es_principal: 'desc' },
          take: 1,
        },
        producto_variante: {
          where: { estado: 'activo' },
          include: {
            talla: true,
            color: true,
            inventario_sucursal: {
              where: { id_sucursal: Number(id_sucursal) },
            },
          },
        },
        promocion_producto: {
          include: {
            promocion: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
      take: 100,
    });

    return productos.map((p) => {
      // Calcular promociones autorizadas activas
      const activePromo = (p.promocion_producto || []).find((pp: any) => {
        const promo = pp.promocion;
        if (!promo || promo.estado !== 'activo') return false;
        const ini = new Date(promo.fecha_inicio);
        const fin = new Date(promo.fecha_fin);
        return ini <= now && fin >= now;
      });

      const precioBase = Number(p.precio_base);

      const variantes = p.producto_variante.map((v) => {
        const inv = v.inventario_sucursal[0];
        const stockDisponible = inv ? inv.stock_disponible : 0;
        const precioAdicional = Number(v.precio_adicional || 0);
        const precioUnitario = Math.round((precioBase + precioAdicional) * 100) / 100;

        let precioFinal = precioUnitario;
        let descuentoPorcentaje = 0;
        let promocionInfo: any = null;

        if (activePromo && activePromo.promocion) {
          const promo = activePromo.promocion;
          if (promo.tipo_descuento === 'porcentaje') {
            descuentoPorcentaje = Number(promo.valor_descuento);
            precioFinal = Math.round(precioUnitario * (1 - descuentoPorcentaje / 100) * 100) / 100;
          } else {
            const monto = Number(promo.valor_descuento);
            precioFinal = Math.max(0, Math.round((precioUnitario - monto) * 100) / 100);
            descuentoPorcentaje = precioUnitario > 0 ? Math.round((monto / precioUnitario) * 100) : 0;
          }

          promocionInfo = {
            id_promocion: promo.id_promocion,
            nombre: promo.nombre,
            tipo_descuento: promo.tipo_descuento,
            descuento_porcentaje: descuentoPorcentaje,
          };
        }

        return {
          id_producto_variante: v.id_producto_variante,
          sku: v.sku,
          talla: v.talla?.codigo || 'U',
          color: v.color?.nombre || 'General',
          color_hex: v.color?.codigo_hex || '#000000',
          stock_disponible: stockDisponible,
          precio_regular: precioUnitario,
          precio_final: precioFinal,
          tiene_descuento: precioFinal < precioUnitario,
          promocion: promocionInfo,
        };
      });

      // Stock total en esta sucursal sumando todas las variantes
      const stockTotalSucursal = variantes.reduce((acc, v) => acc + v.stock_disponible, 0);

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'Sin categoría',
        id_categoria: p.id_categoria,
        imagen: p.imagen_producto[0]?.url || null,
        precio_base: precioBase,
        stock_sucursal_total: stockTotalSucursal,
        variantes,
      };
    });
  }

  /**
   * Búsqueda ágil de clientes por CI, NIT, nombre o teléfono
   */
  async searchClients(search: string) {
    if (!search || search.trim().length < 2) {
      return [];
    }

    const q = search.trim();
    const clientes = await this.prisma.cliente.findMany({
      where: {
        OR: [
          { ci: { contains: q, mode: 'insensitive' } },
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        usuario: {
          select: { email: true },
        },
      },
      take: 10,
    });

    return clientes.map((c) => ({
      id_cliente: c.id_cliente,
      ci: c.ci,
      nombre_completo: `${c.nombre} ${c.apellido}`.trim(),
      email: c.usuario?.email || null,
      puntos_fidelidad: c.puntos_fidelidad,
    }));
  }

  /**
   * Registra una venta física en mostrador, procesa el cobro, descuenta inventario y genera factura
   */
  async registerPresentialSale(user: any, dto: CreatePresentialSaleDto, ip?: string) {
    const userId = Number(user?.id_usuario ?? user?.sub);
    const rolNorm = (user?.rol || user?.rol?.nombre || '').toLowerCase().trim();
    const isAdmin = user?.id_rol === 1 || rolNorm === 'administrador';
    const now = new Date();

    // 1. Validar Cajero y Sucursal
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id_sucursal: dto.id_sucursal },
      include: { ciudad: true },
    });

    if (!sucursal || sucursal.estado !== 'activo') {
      throw new BadRequestException('La sucursal seleccionada no existe o se encuentra inactiva.');
    }

    if (!isAdmin) {
      const acceso = await this.prisma.empleado_sucursal.findFirst({
        where: {
          id_empleado: userId,
          id_sucursal: dto.id_sucursal,
        },
      });

      // Si no tiene asignación directa pero el usuario existe, validar si es empleado
      if (!acceso) {
        const esEmpleado = await this.prisma.empleado.findFirst({
          where: { id_empleado: userId, estado: 'activo' },
        });

        if (!esEmpleado) {
          throw new ForbiddenException(
            'No tienes permisos de Cajero asignados para operar en esta sucursal.',
          );
        }
      }
    }

    // Encontrar ID de empleado responsable para registrar en venta y movimiento
    const empRecord =
      (await this.prisma.empleado.findFirst({
        where: { id_empleado: userId, estado: 'activo' },
      })) ||
      (await this.prisma.empleado.findFirst({
        where: { estado: 'activo' },
        orderBy: { id_empleado: 'asc' },
      }));

    const idEmpleadoResponsable = empRecord ? empRecord.id_empleado : userId;

    // 2. Validar Existencias e Items en la Sucursal
    const itemRecords: {
      itemDto: { id_producto_variante: number; cantidad: number };
      variante: any;
      inventario: any;
      precioUnitario: number;
      precioFinal: number;
      subtotalOriginal: number;
      subtotalFinal: number;
      descuento: number;
    }[] = [];

    for (const it of dto.items) {
      const variante = await this.prisma.producto_variante.findUnique({
        where: { id_producto_variante: it.id_producto_variante },
        include: {
          producto: {
            include: {
              imagen_producto: { orderBy: { es_principal: 'desc' }, take: 1 },
              promocion_producto: { include: { promocion: true } },
            },
          },
          talla: true,
          color: true,
          inventario_sucursal: {
            where: { id_sucursal: dto.id_sucursal },
          },
        },
      });

      if (!variante || variante.estado !== 'activo') {
        throw new BadRequestException(
          `La prenda ID #${it.id_producto_variante} no existe o se encuentra inactiva.`,
        );
      }

      const inv = variante.inventario_sucursal[0];
      const stockDisponible = inv ? inv.stock_disponible : 0;

      if (stockDisponible < it.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para "${variante.producto.nombre}" (Talla: ${variante.talla?.codigo || 'U'}, Color: ${variante.color?.nombre || 'General'}). Existencias disponibles en tienda: ${stockDisponible}, solicitadas: ${it.cantidad}.`,
        );
      }

      // Precios y Promociones Oficiales Autorizadas
      const precioBase = Number(variante.producto.precio_base);
      const precioAdicional = Number(variante.precio_adicional || 0);
      const precioUnitario = Math.round((precioBase + precioAdicional) * 100) / 100;

      const activePromo = (variante.producto.promocion_producto || []).find((pp: any) => {
        const promo = pp.promocion;
        if (!promo || promo.estado !== 'activo') return false;
        const ini = new Date(promo.fecha_inicio);
        const fin = new Date(promo.fecha_fin);
        return ini <= now && fin >= now;
      });

      let precioFinal = precioUnitario;
      if (activePromo && activePromo.promocion) {
        const promo = activePromo.promocion;
        if (promo.tipo_descuento === 'porcentaje') {
          const desc = Number(promo.valor_descuento);
          precioFinal = Math.round(precioUnitario * (1 - desc / 100) * 100) / 100;
        } else {
          const monto = Number(promo.valor_descuento);
          precioFinal = Math.max(0, Math.round((precioUnitario - monto) * 100) / 100);
        }
      }

      const subtotalOrig = Math.round(precioUnitario * it.cantidad * 100) / 100;
      const subtotalFin = Math.round(precioFinal * it.cantidad * 100) / 100;
      const descItem = Math.round((subtotalOrig - subtotalFin) * 100) / 100;

      itemRecords.push({
        itemDto: it,
        variante,
        inventario: inv,
        precioUnitario,
        precioFinal,
        subtotalOriginal: subtotalOrig,
        subtotalFinal: subtotalFin,
        descuento: descItem,
      });
    }

    // 3. Totales de Liquidación
    const subtotalVenta = Math.round(itemRecords.reduce((acc, it) => acc + it.subtotalOriginal, 0) * 100) / 100;
    const descuentoVenta = Math.round(itemRecords.reduce((acc, it) => acc + it.descuento, 0) * 100) / 100;
    const totalVenta = Math.round((subtotalVenta - descuentoVenta) * 100) / 100;

    // 4. Validar Método de Pago y Vuelto
    let cambioEfectivo = 0;
    if (dto.metodo_pago === 'efectivo') {
      const recibido = Number(dto.monto_recibido ?? totalVenta);
      if (recibido < totalVenta) {
        throw new BadRequestException(
          `El monto recibido (${recibido.toFixed(2)} Bs) es menor al total a pagar (${totalVenta.toFixed(2)} Bs).`,
        );
      }
      cambioEfectivo = Math.round((recibido - totalVenta) * 100) / 100;
    }

    // 5. Resolver Cliente
    let targetClienteId: number | null = dto.id_cliente ?? null;
    let clienteNombre = dto.cliente_nombre?.trim() || 'Cliente Mostrador';
    let clienteCI = dto.cliente_ci?.trim() || '0';

    if (dto.id_cliente) {
      const cli = await this.prisma.cliente.findUnique({
        where: { id_cliente: dto.id_cliente },
      });
      if (cli) {
        clienteNombre = `${cli.nombre} ${cli.apellido}`.trim();
        clienteCI = cli.ci || clienteCI;
      }
    } else if (dto.cliente_ci && dto.cliente_ci.trim() !== '' && dto.cliente_ci !== '0') {
      // Buscar si ya existe por CI
      const existingCli = await this.prisma.cliente.findFirst({
        where: { ci: dto.cliente_ci.trim() },
      });
      if (existingCli) {
        targetClienteId = existingCli.id_cliente;
        clienteNombre = `${existingCli.nombre} ${existingCli.apellido}`.trim();
      }
    }

    // 6. Generar correlativo de factura
    const nextVentaMax = await this.prisma.venta.aggregate({
      _max: { id_venta: true },
    });
    const nextVentaId = (nextVentaMax._max.id_venta || 0) + 1;
    const codigoFactura = `FAC-2026-${String(nextVentaId).padStart(5, '0')}`;

    // Referencia de Transacción
    let transaccionRef = dto.transaccion_externa;
    if (!transaccionRef) {
      if (dto.metodo_pago === 'efectivo') {
        transaccionRef = `EF-POS-${dto.id_sucursal}-${Date.now()}`;
      } else if (dto.metodo_pago === 'qr') {
        transaccionRef = `QR-POS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        transaccionRef = `POS-CARD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    // 7. Transacción Atómica en Base de Datos
    await this.prisma.$transaction(async (tx) => {
      // A. Crear Cabecera de Venta
      await tx.venta.create({
        data: {
          id_venta: nextVentaId,
          codigo_factura: codigoFactura,
          tipo_venta: 'tienda_fisica',
          subtotal: subtotalVenta,
          descuento: descuentoVenta,
          estado: 'Pagada',
          fecha_venta: new Date(),
          id_cliente: targetClienteId,
          id_empleado: idEmpleadoResponsable,
        },
      });

      // B. IDs correlativos para detalles y movimientos
      const detMax = await tx.detalle_venta.aggregate({
        _max: { id_detalle_venta: true },
      });
      let nextDetId = detMax._max.id_detalle_venta || 0;

      const movMax = await tx.movimiento_inventario.aggregate({
        _max: { id_movimiento_inventario: true },
      });
      let nextMovId = movMax._max.id_movimiento_inventario || 0;

      // C. Registrar Detalle de Venta, Descontar Inventario y Movimiento
      for (const rec of itemRecords) {
        nextDetId++;
        nextMovId++;

        // Registrar Detalle
        await tx.detalle_venta.create({
          data: {
            id_detalle_venta: nextDetId,
            id_venta: nextVentaId,
            id_producto_variante: rec.itemDto.id_producto_variante,
            cantidad: rec.itemDto.cantidad,
            precio_unitario: rec.precioFinal,
          },
        });

        // Descontar inventario local
        await tx.inventario_sucursal.update({
          where: {
            id_inventario_sucursal: rec.inventario.id_inventario_sucursal,
          },
          data: {
            stock_disponible: {
              decrement: rec.itemDto.cantidad,
            },
            ultima_actualizacion: new Date(),
          },
        });

        // Registrar movimiento de auditoría de inventario
        await tx.movimiento_inventario.create({
          data: {
            id_movimiento_inventario: nextMovId,
            tipo_movimiento: 'salida',
            cantidad: rec.itemDto.cantidad,
            fecha: new Date(),
            motivo: `Venta Presencial Mostrador #${codigoFactura} en sucursal #${dto.id_sucursal}`,
            id_producto_variante: rec.itemDto.id_producto_variante,
            id_sucursal: dto.id_sucursal,
            id_empleado: idEmpleadoResponsable,
          },
        });
      }

      // D. Registrar Pago
      const pagoMax = await tx.pago.aggregate({
        _max: { id_pago: true },
      });
      const nextPagoId = (pagoMax._max.id_pago || 0) + 1;

      await tx.pago.create({
        data: {
          id_pago: nextPagoId,
          metodo_pago: dto.metodo_pago,
          importe: totalVenta,
          transaccion_externa: transaccionRef,
          estado: 'completado',
          fecha_pago: new Date(),
          id_venta: nextVentaId,
        },
      });
    });

    // 8. Registro de Auditoría en Bitácora
    await this.bitacora.logAction(
      `Venta presencial #${codigoFactura} registrada por empleado #${idEmpleadoResponsable} en sucursal ${sucursal.nombre} (${dto.metodo_pago.toUpperCase()}) por un total de ${totalVenta} Bs`,
      'VENTA',
      userId,
      ip,
    );

    // 9. Construir y Devolver Recibo / Factura Oficial
    const numeroAutorizacion = `AUT-POS-${dto.id_sucursal}-${nextVentaId}-9941`;
    const codigoControl = `CF-POS-${nextVentaId}-${String(codigoFactura).slice(-4)}`;
    const leyendaLegal =
      'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY.';

    return {
      success: true,
      mensaje: 'Venta presencial registrada y facturada con éxito.',
      id_venta: nextVentaId,
      codigo_factura: codigoFactura,
      estado_venta: 'Pagada',
      fecha: new Date().toISOString(),
      sucursal: {
        id_sucursal: sucursal.id_sucursal,
        nombre: sucursal.nombre,
        ciudad: sucursal.ciudad?.nombre,
      },
      cliente: {
        id_cliente: targetClienteId,
        nombre_completo: dto.razon_social_factura || clienteNombre,
        nit_ci: dto.nit_factura || clienteCI,
      },
      pago: {
        metodo_pago: dto.metodo_pago,
        monto_pagado: totalVenta,
        monto_recibido: dto.metodo_pago === 'efectivo' ? (dto.monto_recibido ?? totalVenta) : totalVenta,
        cambio: cambioEfectivo,
        transaccion: transaccionRef,
        fecha_pago: new Date().toISOString(),
      },
      liquidacion: {
        subtotal: subtotalVenta,
        descuento: descuentoVenta,
        total: totalVenta,
      },
      factura: {
        numero_factura: codigoFactura,
        numero_autorizacion: numeroAutorizacion,
        codigo_control: codigoControl,
        leyenda: leyendaLegal,
      },
      items: itemRecords.map((r) => ({
        id_producto_variante: r.itemDto.id_producto_variante,
        nombre_producto: r.variante.producto.nombre,
        sku: r.variante.sku,
        talla: r.variante.talla?.codigo || 'U',
        color: r.variante.color?.nombre || 'General',
        cantidad: r.itemDto.cantidad,
        precio_unitario: r.precioFinal,
        subtotal: r.subtotalFinal,
      })),
    };
  }

  /**
   * Consulta el historial general de ventas (físicas de mostrador y digitales)
   * Permite filtrar por tipo de venta, búsqueda por factura o cliente, y límite.
   */
  async getSalesHistory(user: any, query: { id_sucursal?: number; search?: string; tipo_venta?: string; limit?: number }) {
    const whereClause: any = {};

    if (query.tipo_venta && query.tipo_venta !== 'todos') {
      whereClause.tipo_venta = query.tipo_venta;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      whereClause.OR = [
        { codigo_factura: { contains: q, mode: 'insensitive' } },
        { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: q, mode: 'insensitive' } } },
        { cliente: { ci: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const sales = await this.prisma.venta.findMany({
      where: whereClause,
      include: {
        cliente: true,
        empleado: true,
        pago: {
          orderBy: { fecha_pago: 'desc' },
        },
        detalle_venta: {
          include: {
            producto_variante: {
              include: {
                producto: true,
                talla: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_venta: 'desc' },
      take: query.limit ? Number(query.limit) : 50,
    });

    return sales.map((sale) => ({
      id_venta: sale.id_venta,
      codigo_factura: sale.codigo_factura || `TKT-${String(sale.id_venta).padStart(6, '0')}`,
      tipo_venta: sale.tipo_venta,
      subtotal: Number(sale.subtotal),
      descuento: Number(sale.descuento || 0),
      total: Number(sale.total),
      estado: sale.estado,
      fecha_venta: sale.fecha_venta.toISOString(),
      cliente: sale.cliente
        ? {
            id_cliente: sale.cliente.id_cliente,
            nombre_completo: `${sale.cliente.nombre} ${sale.cliente.apellido}`.trim(),
            ci: sale.cliente.ci,
          }
        : {
            id_cliente: 0,
            nombre_completo: 'Cliente Mostrador / S/N',
            ci: '0',
          },
      empleado: sale.empleado
        ? {
            id_empleado: sale.empleado.id_empleado,
            nombre_completo: `${sale.empleado.nombre} ${sale.empleado.apellido}`.trim(),
            codigo_empleado: sale.empleado.codigo_empleado,
          }
        : null,
      pago: (sale.pago || []).map((p) => ({
        id_pago: p.id_pago,
        metodo_pago: p.metodo_pago,
        monto: Number(p.importe),
        estado: p.estado,
        fecha_pago: p.fecha_pago ? p.fecha_pago.toISOString() : null,
        referencia_transaccion: p.transaccion_externa,
      })),
      items: sale.detalle_venta.map((d) => ({
        id_detalle: d.id_detalle_venta,
        id_producto_variante: d.id_producto_variante,
        nombre_producto: d.producto_variante?.producto?.nombre || 'Prenda de Colección',
        sku: d.producto_variante?.sku || 'N/A',
        talla: d.producto_variante?.talla?.codigo || 'U',
        color: d.producto_variante?.color?.nombre || 'General',
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      })),
    }));
  }
}

