/**
 * @caso-de-uso CU17 — Realizar reserva de prendas
 * @subsistema Reservas
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Cliente -> formulario de reserva -> controlador de reservas -> servicio de disponibilidad -> Reserva/DetalleReserva/Inventario/Sucursal.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import { CreateReservationDto } from './dto/reservations.dto.js';
import { QueryMyReservationsDto } from '../CU18-consultar-cancelar-reserva/dto/cancel-reservation.dto.js';
import {
  QueryBranchReservationsDto,
  UpdateBranchReservationStatusDto,
  ReservationStatusEnum,
} from '../CU19-gestionar-reserva-sucursal/dto/branch-reservations.dto.js';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) { }

  /**
   * Resuelve el ID del cliente para el usuario autenticado
   */
  private async resolveClientId(user: any): Promise<number> {
    const userId = Number(user?.id_usuario ?? user?.sub);
    if (!userId) {
      throw new ForbiddenException('Usuario no identificado en la sesión.');
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { id_cliente: userId },
    });

    if (cliente) {
      return cliente.id_cliente;
    }

    // Si es un usuario registrado sin perfil de cliente (ej. administrador o empleado probando compras),
    // creamos automáticamente el registro de cliente asociado para permitirle operar.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado en la base de datos.');
    }

    const emailName = usuario.email.split('@')[0] || 'Cliente';
    const nuevoCliente = await this.prisma.cliente.create({
      data: {
        id_cliente: userId,
        nombre: emailName,
        apellido: 'Fashion',
      },
    });

    return nuevoCliente.id_cliente;
  }

  /**
   * Genera un código legible y único para la reserva: RES-YYYYMMDD-XXXX
   */
  private generateReservationCode(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `RES-${dateStr}-${randomSuffix}`;
  }

  /**
   * Formatea un valor de hora/Time a formato HH:mm legible
   */
  private formatTimeString(timeVal: any): string {
    if (!timeVal) return '';
    if (typeof timeVal === 'string') {
      if (timeVal.includes('T')) {
        return timeVal.split('T')[1].substring(0, 5);
      }
      return timeVal.substring(0, 5);
    }
    if (timeVal instanceof Date) {
      const hours = timeVal.getUTCHours().toString().padStart(2, '0');
      const mins = timeVal.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    }
    return String(timeVal).substring(0, 5);
  }

  /**
   * Consulta disponibilidad de una variante en todas las sucursales activas
   */
  async getBranchAvailability(variantId: number) {
    const variante = await this.prisma.producto_variante.findUnique({
      where: { id_producto_variante: variantId },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre: true,
            precio_base: true,
            imagen_producto: {
              where: { es_principal: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        talla: true,
        color: true,
      },
    });

    if (!variante) {
      throw new NotFoundException('La variante de producto no existe.');
    }

    const sucursales = await this.prisma.sucursal.findMany({
      where: { estado: 'activo' },
      include: {
        ciudad: true,
        inventario_sucursal: {
          where: { id_producto_variante: variantId },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const sucursalesDisponibilidad = sucursales.map((suc) => {
      const inv = suc.inventario_sucursal[0];
      const stockDisponible = inv ? inv.stock_disponible : 0;
      const stockReservado = inv ? inv.stock_reservado : 0;

      return {
        id_sucursal: suc.id_sucursal,
        nombre: suc.nombre,
        direccion: suc.direccion,
        telefono: suc.telefono,
        hora_apertura: this.formatTimeString(suc.hora_apertura),
        hora_cierre: this.formatTimeString(suc.hora_cierre),
        ciudad: suc.ciudad?.nombre || 'General',
        pais: suc.ciudad?.pais || 'Bolivia',
        stock_disponible: stockDisponible,
        stock_reservado: stockReservado,
        tiene_disponibilidad: stockDisponible > 0,
      };
    });

    return {
      variante: {
        id_producto_variante: variante.id_producto_variante,
        sku: variante.sku,
        precio: Number(variante.producto.precio_base) + Number(variante.precio_adicional),
        producto_id: variante.producto.id_producto,
        producto_nombre: variante.producto.nombre,
        talla: variante.talla.codigo,
        color_nombre: variante.color.nombre,
        color_hex: variante.color.codigo_hex,
        imagen_url: variante.imagen_url || (variante.producto as any).imagen_producto?.[0]?.url || null,
      },
      sucursales: sucursalesDisponibilidad,
    };
  }

  /**
   * Realiza la creación de una reserva temporal de prendas
   */
  async createReservation(user: any, dto: CreateReservationDto, ip?: string) {
    const idCliente = await this.resolveClientId(user);

    // 1. Normalizar items a reservar
    let itemsToReserve: { id_producto_variante: number; cantidad: number }[] = [];
    if (dto.items && Array.isArray(dto.items) && dto.items.length > 0) {
      itemsToReserve = dto.items;
    } else if (dto.id_producto_variante && dto.cantidad) {
      itemsToReserve = [
        {
          id_producto_variante: dto.id_producto_variante,
          cantidad: dto.cantidad,
        },
      ];
    } else {
      throw new BadRequestException(
        'Debe especificar al menos una prenda variante y la cantidad a reservar.',
      );
    }

    // 2. Validar sucursal activa
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id_sucursal: dto.id_sucursal },
      include: { ciudad: true },
    });

    if (!sucursal) {
      throw new NotFoundException('La sucursal seleccionada no existe.');
    }
    if (sucursal.estado.toLowerCase() !== 'activo') {
      throw new BadRequestException('La sucursal seleccionada no se encuentra activa.');
    }

    // 3. Validar existencia y stock de cada variante
    for (const item of itemsToReserve) {
      if (item.cantidad <= 0) {
        throw new BadRequestException('La cantidad a reservar debe ser mayor a cero.');
      }

      const variante = await this.prisma.producto_variante.findUnique({
        where: { id_producto_variante: item.id_producto_variante },
        include: {
          producto: true,
          talla: true,
          color: true,
        },
      });

      if (!variante) {
        throw new NotFoundException(
          `La variante con ID ${item.id_producto_variante} no existe.`,
        );
      }

      if (variante.estado.toLowerCase() !== 'activo' || variante.producto.estado.toLowerCase() !== 'activo') {
        throw new BadRequestException(
          `La prenda "${variante.producto.nombre}" (${variante.talla.codigo} - ${variante.color.nombre}) no está activa para reserva.`,
        );
      }

      const inv = await this.prisma.inventario_sucursal.findUnique({
        where: {
          id_sucursal_id_producto_variante: {
            id_sucursal: dto.id_sucursal,
            id_producto_variante: item.id_producto_variante,
          },
        },
      });

      const stockDisponible = inv ? inv.stock_disponible : 0;
      if (stockDisponible < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente en ${sucursal.nombre} para "${variante.producto.nombre}" (Talla: ${variante.talla.codigo}, Color: ${variante.color.nombre}). Disponibles: ${stockDisponible}, Solicitados: ${item.cantidad}.`,
        );
      }
    }

    // 4. Ejecución atómica en transacción Prisma
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Código único de reserva
      let codigo = this.generateReservationCode();
      const existing = await tx.reserva.findUnique({ where: { codigo } });
      if (existing) {
        codigo = `${codigo}-${Math.floor(10 + Math.random() * 90)}`;
      }

      // Siguiente ID para RESERVA
      const resMax = await tx.reserva.aggregate({
        _max: { id_reserva: true },
      });
      const nextReservaId = (resMax._max.id_reserva || 0) + 1;

      // Calcular fecha prevista de visita
      const fechaReserva = new Date();
      let horarioEstimado: Date;
      if (dto.fecha_visita) {
        horarioEstimado = new Date(dto.fecha_visita);
      } else {
        // Por defecto: mañana a la misma hora
        horarioEstimado = new Date(fechaReserva.getTime() + 24 * 60 * 60 * 1000);
      }

      // Fecha límite de vigencia de la reserva: 48 horas desde la creación
      const fechaLimiteVigencia = new Date(fechaReserva.getTime() + 48 * 60 * 60 * 1000);

      // Crear cabecera de RESERVA
      const nuevaReserva = await tx.reserva.create({
        data: {
          id_reserva: nextReservaId,
          codigo,
          fecha_reserva: fechaReserva,
          horario_estimado: horarioEstimado,
          estado: 'Pendiente',
          observaciones: dto.observaciones?.trim() || null,
          id_cliente: idCliente,
          id_sucursal: dto.id_sucursal,
        },
      });

      // Obtener el máximo actual de DETALLE_RESERVA
      const detMax = await tx.detalle_reserva.aggregate({
        _max: { id_detalle_reserva: true },
      });
      let nextDetId = detMax._max.id_detalle_reserva || 0;

      const detallesCreados = [];

      for (const item of itemsToReserve) {
        nextDetId += 1;

        // Crear detalle de reserva con estado 'Pendiente'
        const detalle = await tx.detalle_reserva.create({
          data: {
            id_detalle_reserva: nextDetId,
            id_reserva: nuevaReserva.id_reserva,
            id_producto_variante: item.id_producto_variante,
            cantidad: item.cantidad,
            estado: 'Pendiente',
          },
          include: {
            producto_variante: {
              include: {
                producto: {
                  select: {
                    id_producto: true,
                    nombre: true,
                    precio_base: true,
                  },
                },
                talla: true,
                color: true,
              },
            },
          },
        });
        detallesCreados.push(detalle);

        // Actualizar inventario_sucursal: decrementar disponible, incrementar reservado
        await tx.inventario_sucursal.update({
          where: {
            id_sucursal_id_producto_variante: {
              id_sucursal: dto.id_sucursal,
              id_producto_variante: item.id_producto_variante,
            },
          },
          data: {
            stock_disponible: { decrement: item.cantidad },
            stock_reservado: { increment: item.cantidad },
            ultima_actualizacion: new Date(),
          },
        });
      }

      return {
        reserva: nuevaReserva,
        detalles: detallesCreados,
        sucursal,
        fechaLimiteVigencia,
      };
    });

    // 5. Auditoría en bitácora
    const userId = Number(user?.id_usuario ?? user?.sub);
    await this.bitacoraService.logAction(
      'Crear Reserva de Prendas',
      `Reserva ${resultado.reserva.codigo} creada en ${resultado.sucursal.nombre} (${itemsToReserve.length} prenda(s) reservada(s))`,
      userId,
      ip,
    );

    // 6. Formatear y devolver comprobante al cliente
    return this.buildReservationReceipt(
      resultado.reserva,
      resultado.detalles,
      resultado.sucursal,
      resultado.fechaLimiteVigencia,
    );
  }

  /**
   * Consulta una reserva por ID para visualización de comprobante
   */
  async getReservationById(user: any, id: number) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id_reserva: id },
      include: {
        sucursal: { include: { ciudad: true } },
        cliente: true,
        detalle_reserva: {
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
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada.');
    }

    const userId = Number(user?.id_usuario ?? user?.sub);
    const isStaff = user?.id_rol === 1 || user?.id_rol === 3 || user?.id_rol === 4;
    if (!isStaff && reserva.id_cliente !== userId) {
      throw new ForbiddenException('No tiene permisos para consultar esta reserva.');
    }

    const fechaLimite = new Date(reserva.fecha_reserva.getTime() + 48 * 60 * 60 * 1000);

    return this.buildReservationReceipt(
      reserva,
      reserva.detalle_reserva,
      reserva.sucursal,
      fechaLimite,
    );
  }

  /**
   * Consulta una reserva por su código único de reserva (ej: RES-20260916-1234)
   */
  async getReservationByCode(user: any, code: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { codigo: code.trim().toUpperCase() },
      include: {
        sucursal: { include: { ciudad: true } },
        cliente: true,
        detalle_reserva: {
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
    });

    if (!reserva) {
      throw new NotFoundException(`No existe ninguna reserva con el código "${code}".`);
    }

    const userId = Number(user?.id_usuario ?? user?.sub);
    const isStaff = user?.id_rol === 1 || user?.id_rol === 3 || user?.id_rol === 4;
    if (!isStaff && reserva.id_cliente !== userId) {
      throw new ForbiddenException('No tiene permisos para consultar esta reserva.');
    }

    const fechaLimite = new Date(reserva.fecha_reserva.getTime() + 48 * 60 * 60 * 1000);

    return this.buildReservationReceipt(
      reserva,
      reserva.detalle_reserva,
      reserva.sucursal,
      fechaLimite,
    );
  }

  /**
   * Estructura los datos del comprobante de reserva
   */
  private buildReservationReceipt(
    reserva: any,
    detalles: any[],
    sucursal: any,
    fechaLimite: Date,
  ) {
    const items = detalles.map((d) => {
      const v = d.producto_variante;
      const precioUnitario = Number(v.producto.precio_base) + Number(v.precio_adicional || 0);
      return {
        id_detalle_reserva: d.id_detalle_reserva,
        id_producto_variante: d.id_producto_variante,
        cantidad: d.cantidad,
        estado: d.estado,
        producto_nombre: v.producto.nombre,
        sku: v.sku,
        talla: v.talla?.codigo || 'N/A',
        color_nombre: v.color?.nombre || 'N/A',
        color_hex: v.color?.codigo_hex || '#111827',
        imagen_url: v.imagen_url || null,
        precio_estimado: precioUnitario,
        subtotal_estimado: precioUnitario * d.cantidad,
      };
    });

    const totalEstimado = items.reduce((acc, i) => acc + i.subtotal_estimado, 0);
    const totalPrendas = items.reduce((acc, i) => acc + i.cantidad, 0);

    return {
      comprobante: {
        id_reserva: reserva.id_reserva,
        codigo: reserva.codigo,
        estado: reserva.estado,
        fecha_reserva: reserva.fecha_reserva,
        horario_estimado: reserva.horario_estimado,
        fecha_limite: fechaLimite,
        observaciones: reserva.observaciones,
        dias_vigencia: 2,
      },
      sucursal: {
        id_sucursal: sucursal.id_sucursal,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        horario: `${this.formatTimeString(sucursal.hora_apertura)} - ${this.formatTimeString(sucursal.hora_cierre)}`,
        ciudad: sucursal.ciudad?.nombre || 'General',
      },
      resumen: {
        total_prendas: totalPrendas,
        total_estimado: totalEstimado,
      },
      items,
      instrucciones: [
        'Presenta este comprobante o el código de reserva en el mostrador de la sucursal seleccionada.',
        'Tus prendas estarán apartadas durante 48 horas sin costo adicional.',
        'Podrás probártelas en los vestidores de la tienda antes de decidir tu compra.',
        'El pago se realiza únicamente si decides adquirir las prendas.',
      ],
    };
  }

  /**
   * Expira automáticamente reservas pendientes/confirmadas que hayan superado las 48 horas
   * de vigencia y restituye el stock reservado a disponible en las sucursales.
   */
  public async autoExpireOldReservations(): Promise<number> {
    const ahora = new Date();
    const limiteTiempo = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);

    try {
      const reservasVencidas = await this.prisma.reserva.findMany({
        where: {
          estado: {
            in: [
              'pendiente', 'Pendiente',
              'confirmada', 'Confirmada',
              'preparada', 'Preparada',
            ],
          },
          fecha_reserva: { lt: limiteTiempo },
        },
        include: {
          detalle_reserva: true,
        },
      });

      if (!reservasVencidas || reservasVencidas.length === 0) return 0;

      for (const res of reservasVencidas) {
        await this.prisma.$transaction(async (tx) => {
          // 1. Marcar reserva como Cancelada
          await tx.reserva.update({
            where: { id_reserva: res.id_reserva },
            data: {
              estado: 'Cancelada',
              observaciones: res.observaciones
                ? `${res.observaciones} | Expirada automáticamente: Plazo de 48 hrs superado`
                : 'Expirada automáticamente: Plazo de 48 hrs superado',
            },
          });

          // 2. Marcar detalle como Cancelado
          await tx.detalle_reserva.updateMany({
            where: { id_reserva: res.id_reserva, estado: 'Pendiente' },
            data: { estado: 'Cancelado' },
          });

          // 3. Restituir inventario
          for (const d of res.detalle_reserva) {
            const invActual = await tx.inventario_sucursal.findUnique({
              where: {
                id_sucursal_id_producto_variante: {
                  id_sucursal: res.id_sucursal,
                  id_producto_variante: d.id_producto_variante,
                },
              },
            });

            if (invActual) {
              const nuevoReservado = Math.max(0, invActual.stock_reservado - d.cantidad);
              const nuevoDisponible = invActual.stock_disponible + d.cantidad;
              await tx.inventario_sucursal.update({
                where: { id_inventario_sucursal: invActual.id_inventario_sucursal },
                data: {
                  stock_disponible: nuevoDisponible,
                  stock_reservado: nuevoReservado,
                  ultima_actualizacion: new Date(),
                },
              });
            }
          }
        });
      }
      return reservasVencidas.length;
    } catch (err) {
      console.warn('Error en auto-expiración de reservas:', err);
      return 0;
    }
  }

  /**
   * CU18: Consulta las reservas del cliente autenticado con filtros (activas / historicas)
   */
  async getMyReservations(user: any, query: QueryMyReservationsDto) {
    // 1. Ejecutar auto-expiración previa para limpiar reservas con plazo vencido
    await this.autoExpireOldReservations();

    const idCliente = await this.resolveClientId(user);

    const where: any = {
      id_cliente: idCliente,
    };

    const filterVal = (query.tipo || query.filtro || 'activas').toLowerCase().trim();

    if (query.estado && query.estado.trim()) {
      where.estado = { equals: query.estado.trim(), mode: 'insensitive' };
    } else if (filterVal === 'activas') {
      where.estado = {
        in: [
          'pendiente', 'Pendiente',
          'confirmada', 'Confirmada',
          'preparada', 'Preparada',
        ],
      };
    } else if (filterVal === 'historicas' || filterVal === 'historico') {
      where.estado = {
        in: [
          'atendida', 'Atendida',
          'completada', 'Completada',
          'cancelada', 'Cancelada',
          'expirada', 'Expirada',
        ],
      };
    }

    const reservas = await this.prisma.reserva.findMany({
      where,
      include: {
        sucursal: {
          include: { ciudad: true },
        },
        detalle_reserva: {
          include: {
            producto_variante: {
              include: {
                producto: {
                  select: {
                    id_producto: true,
                    nombre: true,
                    precio_base: true,
                    imagen_producto: {
                      where: { es_principal: true },
                      select: { url: true },
                      take: 1,
                    },
                  },
                },
                talla: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_reserva: 'desc' },
    });

    return reservas.map((reserva) => {
      const fechaLimite = new Date(reserva.fecha_reserva.getTime() + 48 * 60 * 60 * 1000);
      const esCancelable = ['pendiente', 'confirmada'].includes(reserva.estado.toLowerCase());

      const items = reserva.detalle_reserva.map((d) => {
        const v = d.producto_variante;
        const precioUnitario = Number(v.producto.precio_base) + Number(v.precio_adicional || 0);
        return {
          id_detalle_reserva: d.id_detalle_reserva,
          id_producto_variante: d.id_producto_variante,
          cantidad: d.cantidad,
          estado: d.estado,
          producto_nombre: v.producto.nombre,
          sku: v.sku,
          talla: v.talla?.codigo || 'N/A',
          color_nombre: v.color?.nombre || 'N/A',
          color_hex: v.color?.codigo_hex || '#111827',
          imagen_url: v.imagen_url || (v.producto as any).imagen_producto?.[0]?.url || null,
          precio_estimado: precioUnitario,
          subtotal_estimado: precioUnitario * d.cantidad,
        };
      });

      const totalPrendas = items.reduce((acc, i) => acc + i.cantidad, 0);
      const totalEstimado = items.reduce((acc, i) => acc + i.subtotal_estimado, 0);

      return {
        id_reserva: reserva.id_reserva,
        codigo: reserva.codigo,
        estado: reserva.estado,
        fecha_reserva: reserva.fecha_reserva,
        horario_estimado: reserva.horario_estimado,
        fecha_limite: fechaLimite,
        es_cancelable: esCancelable,
        observaciones: reserva.observaciones,
        sucursal: {
          id_sucursal: reserva.sucursal.id_sucursal,
          nombre: reserva.sucursal.nombre,
          direccion: reserva.sucursal.direccion,
          telefono: reserva.sucursal.telefono,
          horario: `${reserva.sucursal.hora_apertura} - ${reserva.sucursal.hora_cierre}`,
          ciudad: reserva.sucursal.ciudad?.nombre || 'General',
        },
        items,
        total_prendas: totalPrendas,
        total_estimado: totalEstimado,
      };
    });
  }

  /**
   * CU18: Cancela una reserva del cliente autenticado y restituye el inventario reservado
   */
  async cancelMyReservation(
    user: any,
    reservationId: number,
    motivo?: string,
    ip?: string,
  ) {
    const idCliente = await this.resolveClientId(user);

    const reserva = await this.prisma.reserva.findUnique({
      where: { id_reserva: reservationId },
      include: {
        detalle_reserva: true,
        sucursal: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva que deseas cancelar no existe.');
    }

    const isStaff = user?.id_rol === 1 || user?.id_rol === 3;
    if (!isStaff && reserva.id_cliente !== idCliente) {
      throw new ForbiddenException('No tienes permisos para cancelar una reserva de otro cliente.');
    }

    const estadoNorm = reserva.estado.toLowerCase().trim();

    if (estadoNorm === 'cancelada') {
      throw new BadRequestException('Esta reserva ya ha sido cancelada previamente.');
    }

    if (estadoNorm === 'completada') {
      throw new BadRequestException(
        'Esta reserva ya fue completada y convertida en venta presencial; no puede cancelarse.',
      );
    }

    if (estadoNorm === 'atendida') {
      throw new BadRequestException(
        'Esta reserva ya fue atendida en sucursal y se encuentra en proceso; no puede cancelarse.',
      );
    }

    if (estadoNorm === 'expirada') {
      throw new BadRequestException('Esta reserva ya ha expirado por superar el plazo de 48 horas.');
    }

    if (!['pendiente', 'confirmada'].includes(estadoNorm)) {
      throw new BadRequestException(`No es posible cancelar una reserva en estado "${reserva.estado}".`);
    }

    // Ejecutar cancelación y restitución de inventario en una transacción atómica
    const resultado = await this.prisma.$transaction(async (tx) => {
      // 1. Actualizar estado de la reserva cabecera
      const obsTexto = motivo?.trim()
        ? [reserva.observaciones, `Cancelada por el cliente: ${motivo.trim()}`]
          .filter(Boolean)
          .join(' | ')
        : reserva.observaciones;

      const reservaActualizada = await tx.reserva.update({
        where: { id_reserva: reservationId },
        data: {
          estado: 'Cancelada',
          observaciones: obsTexto,
        },
      });

      // 2. Actualizar estado de detalle_reserva a 'Cancelado'
      await tx.detalle_reserva.updateMany({
        where: {
          id_reserva: reservationId,
          estado: 'Pendiente',
        },
        data: {
          estado: 'Cancelado',
        },
      });

      // 3. Restituir existencias en inventario_sucursal para cada variante
      let prendasLiberadas = 0;
      for (const d of reserva.detalle_reserva) {
        if (d.estado === 'Pendiente' || d.estado === 'Cancelado') {
          const invActual = await tx.inventario_sucursal.findUnique({
            where: {
              id_sucursal_id_producto_variante: {
                id_sucursal: reserva.id_sucursal,
                id_producto_variante: d.id_producto_variante,
              },
            },
          });

          if (invActual) {
            const nuevoReservado = Math.max(0, invActual.stock_reservado - d.cantidad);
            const nuevoDisponible = invActual.stock_disponible + d.cantidad;

            await tx.inventario_sucursal.update({
              where: {
                id_inventario_sucursal: invActual.id_inventario_sucursal,
              },
              data: {
                stock_disponible: nuevoDisponible,
                stock_reservado: nuevoReservado,
                ultima_actualizacion: new Date(),
              },
            });
            prendasLiberadas += d.cantidad;
          }
        }
      }

      return {
        reserva: reservaActualizada,
        prendasLiberadas,
      };
    });

    // 4. Registrar auditoría en bitácora
    const userId = Number(user?.id_usuario ?? user?.sub);
    await this.bitacoraService.logAction(
      'Cancelar Reserva de Prendas',
      `Reserva ${reserva.codigo} cancelada en ${reserva.sucursal.nombre} (${resultado.prendasLiberadas} prenda(s) liberada(s)). Motivo: ${motivo || 'No especificado'}`,
      userId,
      ip,
    );

    return {
      success: true,
      mensaje: `La reserva ${reserva.codigo} fue cancelada exitosamente y las prendas fueron devueltas a la disponibilidad de la tienda.`,
      id_reserva: resultado.reserva.id_reserva,
      codigo: resultado.reserva.codigo,
      estado: resultado.reserva.estado,
      prendas_liberadas: resultado.prendasLiberadas,
    };
  }

  // =========================================================================
  // CASO DE USO 19: Gestionar Reserva en Sucursal
  // =========================================================================

  /**
   * Obtiene la lista de sucursales a las que el usuario autenticado tiene acceso.
   * Administrador (id_rol = 1): Todas las sucursales activas.
   * Encargado (id_rol = 3) / Cajero (id_rol = 4) / Empleado: Solo sucursales vinculadas en empleado_sucursal.
   */
  async getBranchStaffBranches(user: any) {
    const userId = Number(user?.id_usuario ?? user?.sub);
    const isAdmin = user?.id_rol === 1;

    if (isAdmin) {
      return this.prisma.sucursal.findMany({
        where: { estado: 'activo' },
        include: { ciudad: true },
        orderBy: { nombre: 'asc' },
      });
    }

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

    return asignaciones.map((a) => a.sucursal);
  }

  /**
   * Lista las reservas de sucursales para el personal de tienda.
   */
  async getBranchReservations(user: any, query: QueryBranchReservationsDto) {
    const userId = Number(user?.id_usuario ?? user?.sub);
    const isAdmin = user?.id_rol === 1;

    // Determinar sucursales autorizadas
    let authorizedBranchIds: number[] = [];
    if (isAdmin) {
      if (query.sucursalId) {
        authorizedBranchIds = [Number(query.sucursalId)];
      }
    } else {
      const asignaciones = await this.prisma.empleado_sucursal.findMany({
        where: { id_empleado: userId },
        select: { id_sucursal: true },
      });
      authorizedBranchIds = asignaciones.map((a) => a.id_sucursal);

      if (authorizedBranchIds.length === 0) {
        return {
          data: [],
          total: 0,
          page: query.page || 1,
          limit: query.limit || 20,
          metrics: {
            pendientes: 0,
            preparadas: 0,
            atendidas: 0,
            completadas: 0,
            canceladas: 0,
            total: 0,
          },
        };
      }

      if (query.sucursalId) {
        const reqBranchId = Number(query.sucursalId);
        if (!authorizedBranchIds.includes(reqBranchId)) {
          throw new ForbiddenException('No tiene permisos sobre la sucursal seleccionada.');
        }
        authorizedBranchIds = [reqBranchId];
      }
    }

    // Construir filtro de búsqueda
    const where: any = {};
    if (authorizedBranchIds.length > 0) {
      where.id_sucursal = { in: authorizedBranchIds };
    }

    if (query.estado && query.estado !== 'todos') {
      const st = query.estado.toLowerCase().trim();
      if (st === 'activas') {
        where.estado = {
          in: [
            'pendiente', 'Pendiente',
            'confirmada', 'Confirmada',
            'preparada', 'Preparada',
            'atendida', 'Atendida',
          ],
        };
      } else if (st === 'historico' || st === 'historicas') {
        where.estado = {
          in: [
            'completada', 'Completada',
            'cancelada', 'Cancelada',
            'expirada', 'Expirada',
          ],
        };
      } else if (st === 'pendiente' || st === 'pendientes') {
        where.estado = { in: ['pendiente', 'Pendiente', 'confirmada', 'Confirmada'] };
      } else if (st === 'preparada' || st === 'preparadas') {
        where.estado = { in: ['preparada', 'Preparada'] };
      } else if (st === 'atendida' || st === 'atendidas') {
        where.estado = { in: ['atendida', 'Atendida'] };
      } else if (st === 'completada' || st === 'completadas') {
        where.estado = { in: ['completada', 'Completada'] };
      } else if (st === 'cancelada' || st === 'canceladas') {
        where.estado = { in: ['cancelada', 'Cancelada', 'expirada', 'Expirada'] };
      } else {
        where.estado = {
          in: [st, query.estado.trim(), query.estado.trim().toUpperCase(), query.estado.trim().toLowerCase()],
        };
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { codigo: { contains: term, mode: 'insensitive' } },
        { cliente: { nombre: { contains: term, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: term, mode: 'insensitive' } } },
        { cliente: { ci: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 20));
    const skip = (page - 1) * limit;

    // Calcular métricas de la sucursal o sucursales
    const baseMetricWhere: any = {};
    if (authorizedBranchIds.length > 0) {
      baseMetricWhere.id_sucursal = { in: authorizedBranchIds };
    }

    const [
      total,
      reservas,
      pendientesCount,
      preparadasCount,
      atendidasCount,
      completadasCount,
      canceladasCount,
    ] = await Promise.all([
      this.prisma.reserva.count({ where }),
      this.prisma.reserva.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_reserva: 'desc' },
        include: {
          cliente: {
            select: {
              id_cliente: true,
              nombre: true,
              apellido: true,
              ci: true,
              sexo: true,
            },
          },
          sucursal: {
            select: {
              id_sucursal: true,
              nombre: true,
              direccion: true,
              telefono: true,
              ciudad: { select: { nombre: true } },
            },
          },
          detalle_reserva: {
            include: {
              producto_variante: {
                include: {
                  producto: {
                    select: {
                      id_producto: true,
                      nombre: true,
                      precio_base: true,
                      imagen_producto: {
                        select: { url: true },
                        take: 1,
                      },
                    },
                  },
                  talla: { select: { id_talla: true, codigo: true } },
                  color: { select: { id_color: true, nombre: true, codigo_hex: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.reserva.count({
        where: {
          ...baseMetricWhere,
          estado: { in: ['pendiente', 'Pendiente', 'confirmada', 'Confirmada'] },
        },
      }),
      this.prisma.reserva.count({
        where: {
          ...baseMetricWhere,
          estado: { in: ['preparada', 'Preparada'] },
        },
      }),
      this.prisma.reserva.count({
        where: {
          ...baseMetricWhere,
          estado: { in: ['atendida', 'Atendida'] },
        },
      }),
      this.prisma.reserva.count({
        where: {
          ...baseMetricWhere,
          estado: { in: ['completada', 'Completada'] },
        },
      }),
      this.prisma.reserva.count({
        where: {
          ...baseMetricWhere,
          estado: { in: ['cancelada', 'Cancelada', 'expirada', 'Expirada'] },
        },
      }),
    ]);

    const formattedData = reservas.map((res) => {
      const totalPrendas = res.detalle_reserva.reduce((acc, d) => acc + d.cantidad, 0);
      const totalEstimado = res.detalle_reserva.reduce((acc, d) => {
        const pBase = Number(d.producto_variante.producto.precio_base) || 0;
        const pAdd = Number(d.producto_variante.precio_adicional) || 0;
        return acc + (pBase + pAdd) * d.cantidad;
      }, 0);

      const items = res.detalle_reserva.map((d) => {
        const pBase = Number(d.producto_variante.producto.precio_base) || 0;
        const pAdd = Number(d.producto_variante.precio_adicional) || 0;
        const pUnit = pBase + pAdd;
        const subtotal = pUnit * d.cantidad;

        return {
          id_detalle_reserva: d.id_detalle_reserva,
          id_producto_variante: d.id_producto_variante,
          cantidad: d.cantidad,
          estado: d.estado,
          producto_id: d.producto_variante.producto.id_producto,
          producto_nombre: d.producto_variante.producto.nombre,
          sku: d.producto_variante.sku,
          talla: d.producto_variante.talla.codigo,
          color_nombre: d.producto_variante.color.nombre,
          color_hex: d.producto_variante.color.codigo_hex,
          imagen_url:
            d.producto_variante.imagen_url ||
            d.producto_variante.producto.imagen_producto?.[0]?.url ||
            null,
          precio_estimado: pUnit,
          subtotal_estimado: subtotal,
        };
      });

      return {
        id_reserva: res.id_reserva,
        codigo: res.codigo,
        estado: res.estado,
        fecha_reserva: res.fecha_reserva.toISOString(),
        horario_estimado: res.horario_estimado ? res.horario_estimado.toISOString() : null,
        observaciones: res.observaciones,
        cliente: {
          id_cliente: res.cliente.id_cliente,
          nombre_completo: `${res.cliente.nombre} ${res.cliente.apellido}`.trim(),
          ci: res.cliente.ci,
        },
        sucursal: {
          id_sucursal: res.sucursal.id_sucursal,
          nombre: res.sucursal.nombre,
          direccion: res.sucursal.direccion,
          ciudad: res.sucursal.ciudad.nombre,
        },
        items,
        total_prendas: totalPrendas,
        total_estimado: totalEstimado,
        acciones_disponibles: this.getAvailableActions(res.estado),
      };
    });

    return {
      data: formattedData,
      total,
      page,
      limit,
      metrics: {
        pendientes: pendientesCount,
        preparadas: preparadasCount,
        atendidas: atendidasCount,
        completadas: completadasCount,
        canceladas: canceladasCount,
        total: pendientesCount + preparadasCount + atendidasCount + completadasCount + canceladasCount,
      },
    };
  }

  /**
   * Determina las acciones permitidas según el estado actual de la reserva
   */
  private getAvailableActions(estado: string): string[] {
    switch (estado) {
      case 'Pendiente':
        return ['preparar', 'cancelar'];
      case 'Preparada':
        return ['atender', 'cancelar'];
      case 'Atendida':
        return ['completar', 'cancelar'];
      default:
        return [];
    }
  }

  /**
   * Actualiza el estado de una reserva en sucursal (Preparada, Atendida, Completada, Cancelada)
   */
  async updateBranchReservationStatus(
    user: any,
    reservationId: number,
    dto: UpdateBranchReservationStatusDto,
    ip?: string,
  ) {
    const userId = Number(user?.id_usuario ?? user?.sub);
    const isAdmin = user?.id_rol === 1;

    // 1. Obtener la reserva
    const reserva = await this.prisma.reserva.findUnique({
      where: { id_reserva: reservationId },
      include: {
        sucursal: true,
        cliente: true,
        detalle_reserva: {
          include: {
            producto_variante: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
    });

    if (!reserva) {
      throw new NotFoundException(`La reserva #${reservationId} no existe.`);
    }

    // 2. Validar que el empleado tenga acceso a la sucursal de la reserva
    if (!isAdmin) {
      const acceso = await this.prisma.empleado_sucursal.findUnique({
        where: {
          id_empleado_id_sucursal: {
            id_empleado: userId,
            id_sucursal: reserva.id_sucursal,
          },
        },
      });

      if (!acceso) {
        throw new ForbiddenException(
          `No tiene permisos asignados para operar en la sucursal "${reserva.sucursal.nombre}".`,
        );
      }
    }

    // 3. Validar transiciones de estado permitidas
    const estadoActual = reserva.estado;
    const targetEstado = dto.nuevo_estado;

    if (['Completada', 'Cancelada', 'Expirada'].includes(estadoActual)) {
      throw new BadRequestException(
        `La reserva se encuentra en estado "${estadoActual}" y ya está finalizada. No se admiten modificaciones.`,
      );
    }

    if (targetEstado === ReservationStatusEnum.PREPARADA) {
      if (estadoActual !== 'Pendiente') {
        throw new BadRequestException(
          `Solo se puede marcar como "Preparada" una reserva que esté en estado "Pendiente" (actual: ${estadoActual}).`,
        );
      }
    } else if (targetEstado === ReservationStatusEnum.ATENDIDA) {
      if (estadoActual !== 'Preparada' && estadoActual !== 'Pendiente') {
        throw new BadRequestException(
          `Para marcar como "Atendida", la reserva debe estar preparada o pendiente (actual: ${estadoActual}).`,
        );
      }
    } else if (targetEstado === ReservationStatusEnum.COMPLETADA) {
      if (estadoActual !== 'Atendida' && estadoActual !== 'Preparada') {
        throw new BadRequestException(
          `Solo se puede completar la venta de una reserva que haya sido atendida en tienda (actual: ${estadoActual}).`,
        );
      }
    }

    // 4. Ejecutar transacción atómica en Prisma
    const resultado = await this.prisma.$transaction(async (tx) => {
      let detalleEstadoTarget: string | null = null;
      let accionBitacora = '';
      let obsTexto = reserva.observaciones;

      if (dto.motivo?.trim()) {
        const nota = `[${targetEstado}]: ${dto.motivo.trim()}`;
        obsTexto = obsTexto ? `${obsTexto} | ${nota}` : nota;
      }

      // Si el cliente compra (Completada):
      if (targetEstado === ReservationStatusEnum.COMPLETADA) {
        detalleEstadoTarget = 'Vendido';
        accionBitacora = 'Completar Venta de Reserva';

        // Descontar definitivamente del inventario reservado: stock_reservado -= cant
        for (const d of reserva.detalle_reserva) {
          const invActual = await tx.inventario_sucursal.findUnique({
            where: {
              id_sucursal_id_producto_variante: {
                id_sucursal: reserva.id_sucursal,
                id_producto_variante: d.id_producto_variante,
              },
            },
          });

          if (invActual) {
            await tx.inventario_sucursal.update({
              where: { id_inventario_sucursal: invActual.id_inventario_sucursal },
              data: {
                stock_reservado: Math.max(0, invActual.stock_reservado - d.cantidad),
                ultima_actualizacion: new Date(),
              },
            });
          }
        }
      } else if (targetEstado === ReservationStatusEnum.CANCELADA) {
        // Si no compra o se cancela:
        detalleEstadoTarget = 'Cancelado';
        accionBitacora = 'Cancelar Reserva en Sucursal';

        // Liberar inventario: stock_disponible += cant, stock_reservado -= cant
        for (const d of reserva.detalle_reserva) {
          const invActual = await tx.inventario_sucursal.findUnique({
            where: {
              id_sucursal_id_producto_variante: {
                id_sucursal: reserva.id_sucursal,
                id_producto_variante: d.id_producto_variante,
              },
            },
          });

          if (invActual) {
            await tx.inventario_sucursal.update({
              where: { id_inventario_sucursal: invActual.id_inventario_sucursal },
              data: {
                stock_disponible: invActual.stock_disponible + d.cantidad,
                stock_reservado: Math.max(0, invActual.stock_reservado - d.cantidad),
                ultima_actualizacion: new Date(),
              },
            });
          }
        }
      } else if (targetEstado === ReservationStatusEnum.PREPARADA) {
        accionBitacora = 'Preparar Reserva en Sucursal';
      } else if (targetEstado === ReservationStatusEnum.ATENDIDA) {
        accionBitacora = 'Confirmar Atención de Reserva';
      }

      // Actualizar cabecera de la reserva
      const reservaActualizada = await tx.reserva.update({
        where: { id_reserva: reservationId },
        data: {
          estado: targetEstado,
          observaciones: obsTexto,
        },
      });

      // Actualizar detalle si corresponde (Vendido o Cancelado)
      if (detalleEstadoTarget) {
        await tx.detalle_reserva.updateMany({
          where: { id_reserva: reservationId },
          data: { estado: detalleEstadoTarget },
        });
      }

      return {
        reserva: reservaActualizada,
        accionBitacora,
      };
    });

    // 5. Registrar en bitácora
    await this.bitacoraService.logAction(
      resultado.accionBitacora,
      `Reserva ${reserva.codigo} actualizada a estado "${targetEstado}" en sucursal "${reserva.sucursal.nombre}". ${dto.motivo ? `Detalle: ${dto.motivo}` : ''}`.trim(),
      userId,
      ip,
    );

    return {
      success: true,
      mensaje: `La reserva ${reserva.codigo} fue actualizada a "${targetEstado}" exitosamente.`,
      id_reserva: resultado.reserva.id_reserva,
      codigo: resultado.reserva.codigo,
      estado: resultado.reserva.estado,
    };
  }
}

