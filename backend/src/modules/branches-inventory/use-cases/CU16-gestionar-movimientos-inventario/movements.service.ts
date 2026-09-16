import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateMovementDto, QueryMovementsDto } from './dto/movements.dto.js';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene los IDs de las sucursales permitidas para el usuario autenticado
   */
  private async getAllowedBranchIds(user: any): Promise<number[]> {
    const isSuperAdmin =
      user?.id_rol === 1 ||
      (user?.rol && user.rol.toLowerCase().trim() === 'administrador');

    if (isSuperAdmin) {
      const allBranches = await this.prisma.sucursal.findMany({
        where: { estado: 'activo' },
        select: { id_sucursal: true },
      });
      return allBranches.map((b) => b.id_sucursal);
    }

    const employeeId = user?.id_usuario ?? user?.sub;
    const assigned = await this.prisma.empleado_sucursal.findMany({
      where: { id_empleado: employeeId },
      select: { id_sucursal: true },
    });

    return assigned.map((es) => es.id_sucursal);
  }

  /**
   * Obtiene el ID del empleado asociado al usuario autenticado
   */
  private async getEmployeeId(user: any): Promise<number> {
    const userId = user?.id_usuario ?? user?.sub;

    const employee = await this.prisma.empleado.findUnique({
      where: { id_empleado: userId },
    });

    if (employee) {
      return employee.id_empleado;
    }

    // Si es administrador sin registro específico en empleado, asignar el primer empleado disponible
    const firstEmployee = await this.prisma.empleado.findFirst({
      orderBy: { id_empleado: 'asc' },
    });

    if (firstEmployee) {
      return firstEmployee.id_empleado;
    }

    throw new BadRequestException(
      'No se encontró un registro de empleado para asociar al movimiento.',
    );
  }

  /**
   * Obtiene metadatos para el formulario de movimientos:
   * Sucursales permitidas y variantes activas con información de existencias
   */
  async getMovementMetadata(user: any) {
    const allowedBranchIds = await this.getAllowedBranchIds(user);

    const sucursales = await this.prisma.sucursal.findMany({
      where: {
        id_sucursal: { in: allowedBranchIds },
        estado: 'activo',
      },
      include: {
        ciudad: {
          select: { id_ciudad: true, nombre: true, pais: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    // Obtener todas las variantes de productos activos
    const variantes = await this.prisma.producto_variante.findMany({
      where: {
        estado: 'activo',
        producto: { estado: 'activo' },
      },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre: true,
            precio_base: true,
          },
        },
        talla: { select: { id_talla: true, codigo: true } },
        color: { select: { id_color: true, nombre: true, codigo_hex: true } },
        inventario_sucursal: {
          where: { id_sucursal: { in: allowedBranchIds } },
          select: {
            id_sucursal: true,
            stock_disponible: true,
            stock_reservado: true,
            stock_minimo: true,
          },
        },
      },
      orderBy: [{ id_producto: 'asc' }, { id_producto_variante: 'asc' }],
    });

    return {
      sucursales: sucursales.map((s) => ({
        id_sucursal: s.id_sucursal,
        nombre: s.nombre,
        direccion: s.direccion,
        ciudad: s.ciudad?.nombre,
      })),
      variantes: variantes.map((v) => ({
        id_producto_variante: v.id_producto_variante,
        sku: v.sku,
        producto_nombre: v.producto.nombre,
        precio_base: Number(v.producto.precio_base),
        talla: v.talla.codigo,
        color: v.color.nombre,
        color_hex: v.color.codigo_hex,
        stocks_por_sucursal: v.inventario_sucursal.reduce(
          (acc, inv) => {
            acc[inv.id_sucursal] = {
              stock_disponible: inv.stock_disponible,
              stock_reservado: inv.stock_reservado,
              stock_minimo: inv.stock_minimo,
            };
            return acc;
          },
          {} as Record<
            number,
            { stock_disponible: number; stock_reservado: number; stock_minimo: number }
          >,
        ),
      })),
    };
  }

  /**
   * Registra un movimiento de inventario manual con validación y transacción atómica
   */
  async createMovement(user: any, dto: CreateMovementDto) {
    const allowedBranchIds = await this.getAllowedBranchIds(user);
    if (!allowedBranchIds.includes(dto.id_sucursal)) {
      throw new ForbiddenException(
        'No tiene permisos para registrar movimientos en la sucursal seleccionada.',
      );
    }

    const variante = await this.prisma.producto_variante.findUnique({
      where: { id_producto_variante: dto.id_producto_variante },
      include: { producto: true },
    });

    if (!variante) {
      throw new NotFoundException('La variante de producto seleccionada no existe.');
    }

    const idEmpleado = await this.getEmployeeId(user);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener o inicializar registro en INVENTARIO_SUCURSAL
      let inventario = await tx.inventario_sucursal.findUnique({
        where: {
          id_sucursal_id_producto_variante: {
            id_sucursal: dto.id_sucursal,
            id_producto_variante: dto.id_producto_variante,
          },
        },
      });

      const currentStock = inventario ? inventario.stock_disponible : 0;
      let newStock = currentStock;

      switch (dto.tipo_movimiento) {
        case 'entrada':
        case 'devolucion':
          newStock = currentStock + dto.cantidad;
          break;

        case 'salida':
          if (dto.cantidad > currentStock) {
            throw new BadRequestException(
              `Stock insuficiente. Existencias actuales: ${currentStock} unidad(es), solicitadas: ${dto.cantidad}.`,
            );
          }
          newStock = currentStock - dto.cantidad;
          break;

        case 'ajuste':
          const isNegative =
            dto.motivo.toLowerCase().includes('merma') ||
            dto.motivo.toLowerCase().includes('baja') ||
            dto.motivo.toLowerCase().includes('perdida') ||
            dto.motivo.toLowerCase().includes('daño') ||
            dto.motivo.toLowerCase().includes('salida');

          if (isNegative) {
            if (dto.cantidad > currentStock) {
              throw new BadRequestException(
                `Stock insuficiente para ajuste de baja. Existencias actuales: ${currentStock} unidad(es).`,
              );
            }
            newStock = currentStock - dto.cantidad;
          } else {
            newStock = currentStock + dto.cantidad;
          }
          break;

        default:
          throw new BadRequestException('Tipo de movimiento no reconocido.');
      }

      // 2. Actualizar o insertar en INVENTARIO_SUCURSAL
      if (inventario) {
        await tx.inventario_sucursal.update({
          where: { id_inventario_sucursal: inventario.id_inventario_sucursal },
          data: {
            stock_disponible: newStock,
            ultima_actualizacion: new Date(),
          },
        });
      } else {
        const invMax = await tx.inventario_sucursal.aggregate({
          _max: { id_inventario_sucursal: true },
        });
        const nextInvId = (invMax._max.id_inventario_sucursal || 0) + 1;

        inventario = await tx.inventario_sucursal.create({
          data: {
            id_inventario_sucursal: nextInvId,
            id_sucursal: dto.id_sucursal,
            id_producto_variante: dto.id_producto_variante,
            stock_disponible: newStock,
            stock_reservado: 0,
            stock_minimo: 3,
            ultima_actualizacion: new Date(),
          },
        });
      }

      // 3. Crear registro en MOVIMIENTO_INVENTARIO
      const movMax = await tx.movimiento_inventario.aggregate({
        _max: { id_movimiento_inventario: true },
      });
      const nextMovId = (movMax._max.id_movimiento_inventario || 0) + 1;

      const movimiento = await tx.movimiento_inventario.create({
        data: {
          id_movimiento_inventario: nextMovId,
          tipo_movimiento: dto.tipo_movimiento,
          cantidad: dto.cantidad,
          fecha: new Date(),
          motivo: dto.motivo,
          id_producto_variante: dto.id_producto_variante,
          id_sucursal: dto.id_sucursal,
          id_empleado: idEmpleado,
        },
        include: {
          producto_variante: {
            include: {
              producto: true,
              talla: true,
              color: true,
            },
          },
          sucursal: {
            include: { ciudad: true },
          },
          empleado: true,
        },
      });

      return {
        message: 'Movimiento de inventario registrado con éxito.',
        movimiento,
        stock_anterior: currentStock,
        stock_actual: newStock,
      };
    });
  }

  /**
   * Consulta el historial paginado de movimientos con filtros y métricas
   */
  async getMovements(user: any, query: QueryMovementsDto) {
    const allowedBranchIds = await this.getAllowedBranchIds(user);

    if (query.id_sucursal && !allowedBranchIds.includes(query.id_sucursal)) {
      throw new ForbiddenException(
        'No tiene permisos para consultar movimientos de esta sucursal.',
      );
    }

    const branchFilter = query.id_sucursal
      ? query.id_sucursal
      : { in: allowedBranchIds };

    const where: any = {
      id_sucursal: branchFilter,
    };

    if (query.tipo_movimiento && query.tipo_movimiento !== 'todos') {
      where.tipo_movimiento = query.tipo_movimiento.toLowerCase().trim();
    }

    if (query.fecha_desde || query.fecha_hasta) {
      where.fecha = {};
      if (query.fecha_desde) {
        where.fecha.gte = new Date(query.fecha_desde);
      }
      if (query.fecha_hasta) {
        const hasta = new Date(query.fecha_hasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { motivo: { contains: s, mode: 'insensitive' } },
        {
          producto_variante: {
            producto: { nombre: { contains: s, mode: 'insensitive' } },
          },
        },
        {
          producto_variante: {
            sku: { contains: s, mode: 'insensitive' },
          },
        },
        {
          empleado: {
            OR: [
              { nombre: { contains: s, mode: 'insensitive' } },
              { apellido: { contains: s, mode: 'insensitive' } },
              { codigo_empleado: { contains: s, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [total, items, statsRaw] = await Promise.all([
      this.prisma.movimiento_inventario.count({ where }),
      this.prisma.movimiento_inventario.findMany({
        where,
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
              talla: { select: { id_talla: true, codigo: true } },
              color: { select: { id_color: true, nombre: true, codigo_hex: true } },
            },
          },
          sucursal: {
            select: {
              id_sucursal: true,
              nombre: true,
              ciudad: { select: { nombre: true } },
            },
          },
          empleado: {
            select: {
              id_empleado: true,
              nombre: true,
              apellido: true,
              codigo_empleado: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.movimiento_inventario.groupBy({
        by: ['tipo_movimiento'],
        where: { id_sucursal: branchFilter },
        _sum: { cantidad: true },
        _count: { id_movimiento_inventario: true },
      }),
    ]);

    let totalEntradas = 0;
    let totalSalidas = 0;
    let totalAjustes = 0;
    let totalDevoluciones = 0;
    let totalGlobalMovimientos = 0;

    statsRaw.forEach((stat) => {
      const count = stat._count.id_movimiento_inventario || 0;
      const qty = stat._sum.cantidad || 0;
      totalGlobalMovimientos += count;

      const tipo = stat.tipo_movimiento.toLowerCase();
      if (tipo === 'entrada') {
        totalEntradas += qty;
      } else if (tipo === 'salida' || tipo === 'salida_venta') {
        totalSalidas += qty;
      } else if (tipo === 'ajuste') {
        totalAjustes += qty;
      } else if (tipo === 'devolucion') {
        totalDevoluciones += qty;
      }
    });

    return {
      data: items.map((m) => ({
        id_movimiento: m.id_movimiento_inventario,
        tipo_movimiento: m.tipo_movimiento,
        cantidad: m.cantidad,
        fecha: m.fecha,
        motivo: m.motivo,
        producto: {
          id_producto: m.producto_variante.producto.id_producto,
          nombre: m.producto_variante.producto.nombre,
          precio_base: Number(m.producto_variante.producto.precio_base),
        },
        variante: {
          id_producto_variante: m.producto_variante.id_producto_variante,
          sku: m.producto_variante.sku,
          talla: m.producto_variante.talla.codigo,
          color: m.producto_variante.color.nombre,
          color_hex: m.producto_variante.color.codigo_hex,
        },
        sucursal: {
          id_sucursal: m.sucursal.id_sucursal,
          nombre: m.sucursal.nombre,
          ciudad: m.sucursal.ciudad?.nombre,
        },
        responsable: {
          id_empleado: m.empleado.id_empleado,
          nombre_completo: `${m.empleado.nombre} ${m.empleado.apellido}`,
          codigo: m.empleado.codigo_empleado,
        },
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total_movimientos: totalGlobalMovimientos,
        unidades_ingresadas: totalEntradas,
        unidades_egresadas: totalSalidas,
        unidades_ajustes: totalAjustes,
        unidades_devoluciones: totalDevoluciones,
      },
    };
  }

  /**
   * Obtiene el detalle de un movimiento de inventario específico
   */
  async getMovementDetail(user: any, id: number) {
    const allowedBranchIds = await this.getAllowedBranchIds(user);

    const m = await this.prisma.movimiento_inventario.findUnique({
      where: { id_movimiento_inventario: id },
      include: {
        producto_variante: {
          include: {
            producto: true,
            talla: true,
            color: true,
          },
        },
        sucursal: {
          include: { ciudad: true },
        },
        empleado: true,
      },
    });

    if (!m) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado.`);
    }

    if (!allowedBranchIds.includes(m.id_sucursal)) {
      throw new ForbiddenException(
        'No tiene permisos para ver movimientos de esta sucursal.',
      );
    }

    return {
      id_movimiento: m.id_movimiento_inventario,
      tipo_movimiento: m.tipo_movimiento,
      cantidad: m.cantidad,
      fecha: m.fecha,
      motivo: m.motivo,
      producto: {
        id_producto: m.producto_variante.producto.id_producto,
        nombre: m.producto_variante.producto.nombre,
        precio_base: Number(m.producto_variante.producto.precio_base),
      },
      variante: {
        id_producto_variante: m.producto_variante.id_producto_variante,
        sku: m.producto_variante.sku,
        talla: m.producto_variante.talla.codigo,
        color: m.producto_variante.color.nombre,
        color_hex: m.producto_variante.color.codigo_hex,
      },
      sucursal: {
        id_sucursal: m.sucursal.id_sucursal,
        nombre: m.sucursal.nombre,
        direccion: m.sucursal.direccion,
        ciudad: m.sucursal.ciudad?.nombre,
      },
      responsable: {
        id_empleado: m.empleado.id_empleado,
        nombre_completo: `${m.empleado.nombre} ${m.empleado.apellido}`,
        codigo: m.empleado.codigo_empleado,
      },
    };
  }
}
