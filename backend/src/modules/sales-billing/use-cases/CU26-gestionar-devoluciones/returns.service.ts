/**
 * @caso-de-uso CU26 — Gestionar Devoluciones
 * @subsistema Ventas y Facturación
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import {
  CreateReturnDto,
  QueryReturnsDto,
  UpdateReturnStatusDto,
} from './dto/returns.dto.js';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  /**
   * Crea una solicitud o registro de devolución.
   * Si es cliente: estado inicial 'pendiente'.
   * Si es personal y auto_procesar = true: estado inicial 'procesada' y reingreso a stock automático.
   */
  async createReturn(user: any, dto: CreateReturnDto, ip?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Debes incluir al menos un producto a devolver.');
    }

    // 1. Obtener la venta con todos sus detalles e historial previo de devoluciones
    const venta = await this.prisma.venta.findUnique({
      where: { id_venta: dto.id_venta },
      include: {
        cliente: true,
        empleado: {
          include: {
            empleado_sucursal: {
              include: {
                sucursal: true,
              },
            },
          },
        },
        detalle_venta: {
          include: {
            producto_variante: {
              include: {
                producto: true,
                color: true,
                talla: true,
              },
            },
            detalle_devolucion: {
              include: {
                devolucion: true,
              },
            },
          },
        },
      },
    });

    if (!venta) {
      throw new NotFoundException(`La venta #${dto.id_venta} no existe.`);
    }

    if (venta.estado.toLowerCase() !== 'completada') {
      throw new BadRequestException(
        `Solo se pueden realizar devoluciones de ventas con estado "completada". Estado actual: "${venta.estado}".`,
      );
    }

    // 2. Verificar permisos de usuario
    const isStaff = user?.rol?.nombre?.toLowerCase() !== 'cliente';
    const idClienteUsuario = user?.id_cliente;

    if (!isStaff) {
      if (!idClienteUsuario || venta.id_cliente !== idClienteUsuario) {
        throw new ForbiddenException('No tienes permiso para solicitar devoluciones de esta compra.');
      }
    }

    // 3. Validar cantidades de cada ítem a devolver
    for (const itemDto of dto.items) {
      const detalleVenta = venta.detalle_venta.find(
        (dv) => dv.id_detalle_venta === itemDto.id_detalle_venta,
      );

      if (!detalleVenta) {
        throw new BadRequestException(
          `El ítem con ID ${itemDto.id_detalle_venta} no pertenece a la venta #${dto.id_venta}.`,
        );
      }

      // Sumar devoluciones no rechazadas previamente para este ítem
      const yaDevuelto = detalleVenta.detalle_devolucion
        .filter((dd) => dd.devolucion && dd.devolucion.estado.toLowerCase() !== 'rechazada')
        .reduce((sum, dd) => sum + dd.cantidad, 0);

      const disponibleParaDevolver = detalleVenta.cantidad - yaDevuelto;

      if (itemDto.cantidad > disponibleParaDevolver) {
        throw new BadRequestException(
          `No se pueden devolver ${itemDto.cantidad} unidades del producto "${detalleVenta.producto_variante.producto.nombre}". ` +
            `Compradas: ${detalleVenta.cantidad}, devueltas previamente: ${yaDevuelto}, disponibles para devolución: ${disponibleParaDevolver}.`,
        );
      }
    }

    // 4. Determinar estado final inicial
    const autoProcesar = isStaff && dto.auto_procesar;
    const estadoFinal = autoProcesar ? 'procesada' : 'pendiente';

    // 5. Ejecutar transacción atómica
    return await this.prisma.$transaction(async (tx) => {
      // Calcular ID de devolución
      const maxDev = await tx.devolucion.aggregate({ _max: { id_devolucion: true } });
      const nextDevId = (maxDev._max?.id_devolucion || 0) + 1;

      const nuevaDevolucion = await tx.devolucion.create({
        data: {
          id_devolucion: nextDevId,
          id_venta: dto.id_venta,
          motivo: dto.motivo,
          observacion: dto.observacion || null,
          estado: estadoFinal,
        },
      });

      // Crear detalles de devolución
      const maxDet = await tx.detalle_devolucion.aggregate({
        _max: { id_detalle_devolucion: true },
      });
      let nextDetId = (maxDet._max?.id_detalle_devolucion || 0) + 1;

      for (const itemDto of dto.items) {
        await tx.detalle_devolucion.create({
          data: {
            id_detalle_devolucion: nextDetId++,
            id_venta: dto.id_venta,
            id_devolucion: nextDevId,
            id_detalle_venta: itemDto.id_detalle_venta,
            cantidad: itemDto.cantidad,
            motivo: itemDto.motivo || dto.motivo,
          },
        });
      }

      // Si se auto-procesa (Cajero/Staff), restaurar stock de inmediato
      if (autoProcesar) {
        const idSucursal =
          dto.id_sucursal_reingreso ||
          venta.empleado?.empleado_sucursal?.[0]?.id_sucursal ||
          1;

        const empleado = await tx.empleado.findFirst({
          where: user.id_empleado ? { id_empleado: user.id_empleado } : {},
        });
        const idEmpleado = empleado?.id_empleado || 1;

        const movMax = await tx.movimiento_inventario.aggregate({
          _max: { id_movimiento_inventario: true },
        });
        let nextMovId = (movMax._max?.id_movimiento_inventario || 0) + 1;

        for (const itemDto of dto.items) {
          const dv = venta.detalle_venta.find((d) => d.id_detalle_venta === itemDto.id_detalle_venta)!;

          // Buscar inventario sucursal existente
          const inventarioExistente = await tx.inventario_sucursal.findFirst({
            where: {
              id_sucursal: idSucursal,
              id_producto_variante: dv.id_producto_variante,
            },
          });

          if (inventarioExistente) {
            await tx.inventario_sucursal.update({
              where: { id_inventario_sucursal: inventarioExistente.id_inventario_sucursal },
              data: {
                stock_disponible: inventarioExistente.stock_disponible + itemDto.cantidad,
                ultima_actualizacion: new Date(),
              },
            });
          } else {
            const invMax = await tx.inventario_sucursal.aggregate({
              _max: { id_inventario_sucursal: true },
            });
            const nextInvId = (invMax._max?.id_inventario_sucursal || 0) + 1;

            await tx.inventario_sucursal.create({
              data: {
                id_inventario_sucursal: nextInvId,
                id_sucursal: idSucursal,
                id_producto_variante: dv.id_producto_variante,
                stock_disponible: itemDto.cantidad,
                stock_reservado: 0,
                stock_minimo: 3,
                ultima_actualizacion: new Date(),
              },
            });
          }

          // Registrar movimiento de inventario oficial
          await tx.movimiento_inventario.create({
            data: {
              id_movimiento_inventario: nextMovId++,
              tipo_movimiento: 'devolucion',
              cantidad: itemDto.cantidad,
              fecha: new Date(),
              motivo: `Devolución presencial venta #${venta.codigo_factura || venta.id_venta}: ${itemDto.motivo || dto.motivo}`,
              id_sucursal: idSucursal,
              id_producto_variante: dv.id_producto_variante,
              id_empleado: idEmpleado,
            },
          });
        }
      }

      // Registrar en Bitácora
      await this.bitacora.logAction(
        autoProcesar ? 'Procesar Devolucion' : 'Solicitar Devolucion',
        `Devolucion #${nextDevId} para Venta #${venta.codigo_factura || venta.id_venta}`,
        user.id_usuario,
        ip,
      );

      return {
        message: autoProcesar
          ? 'Devolución registrada y procesada exitosamente con reingreso a stock.'
          : 'Solicitud de devolución registrada exitosamente. Está pendiente de revisión.',
        data: nuevaDevolucion,
      };
    });
  }

  /**
   * Obtiene el historial de devoluciones solicitadas por el cliente autenticado.
   */
  async getMyReturns(user: any) {
    const idCliente = user?.id_cliente;
    if (!idCliente) {
      return [];
    }

    const devoluciones = await this.prisma.devolucion.findMany({
      where: {
        venta: {
          id_cliente: idCliente,
        },
      },
      include: {
        venta: {
          select: {
            id_venta: true,
            codigo_factura: true,
            fecha_venta: true,
            total: true,
          },
        },
        detalle_devolucion: {
          include: {
            detalle_venta: {
              include: {
                producto_variante: {
                  include: {
                    producto: true,
                    color: true,
                    talla: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fecha_hora: 'desc' },
    });

    return devoluciones.map((d) => this.formatReturn(d));
  }

  /**
   * Obtiene la lista completa de devoluciones para Staff / Administradores con paginación y filtros.
   */
  async getAllReturns(query: QueryReturnsDto) {
    const { estado, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { venta: { codigo_factura: { contains: q, mode: 'insensitive' } } },
        { venta: { cliente: { nombre: { contains: q, mode: 'insensitive' } } } },
        { venta: { cliente: { apellido: { contains: q, mode: 'insensitive' } } } },
        { venta: { cliente: { ci: { contains: q, mode: 'insensitive' } } } },
        { motivo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.devolucion.count({ where }),
      this.prisma.devolucion.findMany({
        where,
        skip,
        take: limit,
        include: {
          venta: {
            include: {
              cliente: true,
              empleado: {
                include: {
                  empleado_sucursal: {
                    include: {
                      sucursal: true,
                    },
                  },
                },
              },
            },
          },
          detalle_devolucion: {
            include: {
              detalle_venta: {
                include: {
                  producto_variante: {
                    include: {
                      producto: true,
                      color: true,
                      talla: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { fecha_hora: 'desc' },
      }),
    ]);

    return {
      data: data.map((d) => this.formatReturn(d)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene el detalle completo de una devolución por su ID.
   */
  async getReturnById(id: number, user: any) {
    const devolucion = await this.prisma.devolucion.findUnique({
      where: { id_devolucion: id },
      include: {
        venta: {
          include: {
            cliente: true,
            empleado: {
              include: {
                empleado_sucursal: {
                  include: {
                    sucursal: true,
                  },
                },
              },
            },
          },
        },
        detalle_devolucion: {
          include: {
            detalle_venta: {
              include: {
                producto_variante: {
                  include: {
                    producto: true,
                    color: true,
                    talla: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!devolucion) {
      throw new NotFoundException(`La devolución #${id} no existe.`);
    }

    const isStaff = user?.rol?.nombre?.toLowerCase() !== 'cliente';
    if (!isStaff && devolucion.venta.id_cliente !== user?.id_cliente) {
      throw new ForbiddenException('No tienes permiso para ver esta devolución.');
    }

    return this.formatReturn(devolucion);
  }

  /**
   * Actualiza el estado de una devolución (Aprobar / Rechazar).
   * Si se aprueba ('procesada'), se reingresa automáticamente el stock a la sucursal.
   */
  async updateReturnStatus(id: number, dto: UpdateReturnStatusDto, staffUser: any, ip?: string) {
    const devolucion = await this.prisma.devolucion.findUnique({
      where: { id_devolucion: id },
      include: {
        venta: {
          include: {
            empleado: {
              include: {
                empleado_sucursal: {
                  include: {
                    sucursal: true,
                  },
                },
              },
            },
          },
        },
        detalle_devolucion: {
          include: {
            detalle_venta: true,
          },
        },
      },
    });

    if (!devolucion) {
      throw new NotFoundException(`La devolución #${id} no existe.`);
    }

    if (devolucion.estado.toLowerCase() === 'procesada') {
      throw new BadRequestException('Esta devolución ya fue procesada anteriormente.');
    }

    if (devolucion.estado.toLowerCase() === 'rechazada' && dto.estado === 'rechazada') {
      throw new BadRequestException('Esta devolución ya se encuentra rechazada.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.devolucion.update({
        where: { id_devolucion: id },
        data: {
          estado: dto.estado,
          observacion: dto.observacion
            ? `${devolucion.observacion ? devolucion.observacion + ' | ' : ''}${dto.observacion}`
            : devolucion.observacion,
        },
      });

      // Si el estado pasa a 'procesada', reingresar stock
      if (dto.estado === 'procesada') {
        const idSucursal =
          dto.id_sucursal_reingreso ||
          devolucion.venta.empleado?.empleado_sucursal?.[0]?.id_sucursal ||
          1;

        const empleado = await tx.empleado.findFirst({
          where: staffUser.id_empleado ? { id_empleado: staffUser.id_empleado } : {},
        });
        const idEmpleado = empleado?.id_empleado || 1;

        const movMax = await tx.movimiento_inventario.aggregate({
          _max: { id_movimiento_inventario: true },
        });
        let nextMovId = (movMax._max?.id_movimiento_inventario || 0) + 1;

        for (const det of devolucion.detalle_devolucion) {
          const dv = det.detalle_venta;

          // 1. Incrementar stock en sucursal
          const inventarioExistente = await tx.inventario_sucursal.findFirst({
            where: {
              id_sucursal: idSucursal,
              id_producto_variante: dv.id_producto_variante,
            },
          });

          if (inventarioExistente) {
            await tx.inventario_sucursal.update({
              where: { id_inventario_sucursal: inventarioExistente.id_inventario_sucursal },
              data: {
                stock_disponible: inventarioExistente.stock_disponible + det.cantidad,
                ultima_actualizacion: new Date(),
              },
            });
          } else {
            const invMax = await tx.inventario_sucursal.aggregate({
              _max: { id_inventario_sucursal: true },
            });
            const nextInvId = (invMax._max?.id_inventario_sucursal || 0) + 1;

            await tx.inventario_sucursal.create({
              data: {
                id_inventario_sucursal: nextInvId,
                id_sucursal: idSucursal,
                id_producto_variante: dv.id_producto_variante,
                stock_disponible: det.cantidad,
                stock_reservado: 0,
                stock_minimo: 3,
                ultima_actualizacion: new Date(),
              },
            });
          }

          // 2. Registrar movimiento de inventario oficial
          await tx.movimiento_inventario.create({
            data: {
              id_movimiento_inventario: nextMovId++,
              tipo_movimiento: 'devolucion',
              cantidad: det.cantidad,
              fecha: new Date(),
              motivo: `Devolución aprobada #${id} (Factura #${devolucion.venta.codigo_factura || devolucion.venta.id_venta})`,
              id_sucursal: idSucursal,
              id_producto_variante: dv.id_producto_variante,
              id_empleado: idEmpleado,
            },
          });
        }
      }

      await this.bitacora.logAction(
        dto.estado === 'procesada' ? 'Aprobar Devolucion' : 'Rechazar Devolucion',
        `Devolucion #${id} (Estado: ${dto.estado})`,
        staffUser.id_usuario,
        ip,
      );

      return {
        message:
          dto.estado === 'procesada'
            ? 'Devolución aprobada y procesada con éxito. Stock reingresado a inventario.'
            : 'Devolución rechazada correctamente.',
        data: updated,
      };
    });
  }

  /**
   * Busca ventas por código de factura, comprobante o ID para registrar una devolución rápida en tienda.
   */
  async lookupSaleForReturn(term: string) {
    if (!term || term.trim().length === 0) {
      throw new BadRequestException('Debes ingresar un número de comprobante, factura o ID.');
    }

    const trimmed = term.trim();
    const numericId = parseInt(trimmed.replace(/\D/g, ''), 10);

    const orConditions: any[] = [
      { codigo_factura: { contains: trimmed, mode: 'insensitive' } },
      {
        pago: {
          some: {
            transaccion_externa: { contains: trimmed, mode: 'insensitive' },
          },
        },
      },
    ];

    if (!isNaN(numericId) && numericId > 0) {
      orConditions.push({ id_venta: numericId });
    }

    const ventas = await this.prisma.venta.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        cliente: true,
        pago: true,
        empleado: {
          include: {
            empleado_sucursal: {
              include: {
                sucursal: true,
              },
            },
          },
        },
        detalle_venta: {
          include: {
            producto_variante: {
              include: {
                producto: true,
                color: true,
                talla: true,
              },
            },
            detalle_devolucion: {
              include: {
                devolucion: true,
              },
            },
          },
        },
      },
      take: 8,
    });

    const sucursales = await this.prisma.sucursal.findMany({
      where: {
        estado: { equals: 'activo', mode: 'insensitive' },
      },
      select: {
        id_sucursal: true,
        nombre: true,
        direccion: true,
      },
      orderBy: { id_sucursal: 'asc' },
    });

    const results = ventas.map((v) => {
      let tieneItemsDisponibles = false;
      const items = v.detalle_venta.map((dv) => {
        const devueltoPrevio = (dv.detalle_devolucion || [])
          .filter(
            (dd) =>
              dd.devolucion &&
              ['pendiente', 'procesada'].includes(dd.devolucion.estado.toLowerCase()),
          )
          .reduce((acc, curr) => acc + curr.cantidad, 0);

        const disponible = Math.max(0, dv.cantidad - devueltoPrevio);
        if (disponible > 0) tieneItemsDisponibles = true;

        return {
          id_detalle_venta: dv.id_detalle_venta,
          cantidad_comprada: dv.cantidad,
          cantidad_devuelta: devueltoPrevio,
          cantidad_disponible: disponible,
          precio_unitario: Number(dv.precio_unitario),
          subtotal: Number(dv.subtotal),
          producto: {
            id_producto: dv.producto_variante?.producto?.id_producto,
            nombre: dv.producto_variante?.producto?.nombre || 'Producto',
            sku: dv.producto_variante?.sku,
            imagen_url: dv.producto_variante?.imagen_url,
            color: dv.producto_variante?.color?.nombre,
            talla: dv.producto_variante?.talla?.codigo,
          },
        };
      });

      const sucursalOrigen =
        v.empleado?.empleado_sucursal?.[0]?.sucursal || null;

      const comprobante = v.pago?.[0]?.transaccion_externa || v.codigo_factura || null;

      return {
        id_venta: v.id_venta,
        codigo_factura: v.codigo_factura || `FAC-${v.id_venta}`,
        numero_comprobante: comprobante,
        fecha_venta: v.fecha_venta,
        estado: v.estado,
        total: Number(v.total || v.subtotal || 0),
        cliente: v.cliente
          ? {
              id_cliente: v.cliente.id_cliente,
              nombre: `${v.cliente.nombre} ${v.cliente.apellido}`.trim(),
              ci: v.cliente.ci,
            }
          : null,
        sucursal_origen: sucursalOrigen,
        tiene_items_disponibles: tieneItemsDisponibles,
        items,
      };
    });

    return {
      ventas: results,
      sucursales,
    };
  }

  /**
   * Helper para formatear datos de devolución.
   */
  private formatReturn(d: any) {
    let totalItemsDevueltos = 0;
    let montoAproximadoDevolucion = 0;

    const items = (d.detalle_devolucion || []).map((dd: any) => {
      totalItemsDevueltos += dd.cantidad;
      const precioUnit = Number(dd.detalle_venta?.precio_unitario || 0);
      const subtotalDev = precioUnit * dd.cantidad;
      montoAproximadoDevolucion += subtotalDev;

      return {
        id_detalle_devolucion: dd.id_detalle_devolucion,
        id_detalle_venta: dd.id_detalle_venta,
        cantidad: dd.cantidad,
        motivo: dd.motivo,
        precio_unitario: precioUnit,
        subtotal: subtotalDev,
        producto: {
          id_producto: dd.detalle_venta?.producto_variante?.producto?.id_producto,
          nombre: dd.detalle_venta?.producto_variante?.producto?.nombre || 'Producto',
          sku: dd.detalle_venta?.producto_variante?.sku,
          imagen_url: dd.detalle_venta?.producto_variante?.imagen_url,
          color: dd.detalle_venta?.producto_variante?.color?.nombre,
          talla: dd.detalle_venta?.producto_variante?.talla?.codigo,
        },
      };
    });

    const sucursalNombre =
      d.venta?.empleado?.empleado_sucursal?.[0]?.sucursal?.nombre || 'Sucursal Principal';

    return {
      id_devolucion: d.id_devolucion,
      id_venta: d.id_venta,
      fecha_hora: d.fecha_hora,
      motivo: d.motivo,
      estado: d.estado,
      observacion: d.observacion,
      total_items: totalItemsDevueltos,
      monto_estimado: montoAproximadoDevolucion,
      venta: {
        id_venta: d.venta?.id_venta,
        codigo_factura: d.venta?.codigo_factura || `FAC-${d.venta?.id_venta}`,
        fecha_venta: d.venta?.fecha_venta,
        monto_total: Number(d.venta?.total || d.venta?.subtotal || 0),
        cliente: d.venta?.cliente
          ? {
              id_cliente: d.venta.cliente.id_cliente,
              nombre: `${d.venta.cliente.nombre} ${d.venta.cliente.apellido}`.trim(),
              ci: d.venta.cliente.ci,
            }
          : null,
        sucursal: {
          id_sucursal: d.venta?.empleado?.empleado_sucursal?.[0]?.id_sucursal || 1,
          nombre: sucursalNombre,
        },
      },
      items,
    };
  }
}
