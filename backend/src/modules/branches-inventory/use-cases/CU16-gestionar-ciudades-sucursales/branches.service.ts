/**
 * @file branches.service.ts
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Lógica de Negocio y Persistencia — Backend
 * @responsabilidad Implementa las reglas de negocio para la administración de sucursales físicas:
 * - Conversión y formateo UTC de cadenas horarias (HH:mm).
 * - Búsqueda multicriterio insensible a mayúsculas/minúsculas y acentos.
 * - Validación de duplicidad de nombres de sucursal dentro de una misma ciudad.
 * - Restricción estricta de borrado (impide eliminación si posee historial de inventario, movimientos,
 *   órdenes de compra o reservas, sugiriendo el pase a estado inactivo).
 * - Registro minucioso de acciones en la bitácora del sistema.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import {
  CreateBranchDto,
  QueryBranchesDto,
  UpdateBranchDto,
} from './dto/branches.dto.js';

/**
 * Convierte una cadena de hora "HH:mm" o "HH:mm:ss" a un objeto Date en época UTC 1970-01-01
 * para persistencia compatible en PostgreSQL/Prisma (tipo Time).
 */
function parseTimeStringToDate(timeStr?: string | null): Date | null {
  if (!timeStr || !timeStr.trim()) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
}

/**
 * Formatea un objeto Date representativo de hora a una cadena "HH:mm" en UTC para clientes REST.
 */
function formatTimeToHHmm(date?: Date | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Servicio encargado del ciclo de vida y auditoría de tiendas y sucursales físicas.
 */
@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  /**
   * Obtiene listas maestras (ciudades registradas y empleados activos con sus cargos y sucursales asignadas)
   * para alimentar los desplegables de formularios de alta y edición de tiendas.
   *
   * @returns {Promise<Object>} Ciudades y empleados formateados.
   */
  async getMetadata() {
    const [cities, employees] = await Promise.all([
      this.prisma.ciudad.findMany({
        orderBy: { nombre: 'asc' },
        select: {
          id_ciudad: true,
          nombre: true,
          pais: true,
        },
      }),
      this.prisma.empleado.findMany({
        where: { estado: 'activo' },
        orderBy: { nombre: 'asc' },
        select: {
          id_empleado: true,
          nombre: true,
          apellido: true,
          codigo_empleado: true,
          ci: true,
          usuario: {
            select: {
              email: true,
              rol: { select: { id_rol: true, nombre: true } },
            },
          },
          empleado_sucursal: {
            select: {
              sucursal: {
                select: { id_sucursal: true, nombre: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      cities,
      employees: employees.map((e) => ({
        id_empleado: e.id_empleado,
        nombre_completo: `${e.nombre} ${e.apellido}`,
        codigo_empleado: e.codigo_empleado,
        cargo: e.usuario.rol.nombre,
        ci: e.ci,
        email: e.usuario.email,
        rol: e.usuario.rol.nombre,
        sucursales_actuales: e.empleado_sucursal.map((es) => es.sucursal.nombre),
      })),
    };
  }

  /**
   * Lista sucursales con soporte para paginación, filtros por ciudad, estado y búsqueda general
   * (nombre, dirección, teléfono o ciudad), calculando si posee historial operativo acumulado.
   *
   * @param {QueryBranchesDto} query - Criterios de filtrado y paginación.
   * @returns {Promise<Object>} Lista de sucursales con conteos operativos y metadatos de paginación.
   */
  async findAll(query: QueryBranchesDto) {
    const { search, id_ciudad, estado, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (id_ciudad) {
      where.id_ciudad = id_ciudad;
    }

    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { direccion: { contains: term, mode: 'insensitive' } },
        { telefono: { contains: term, mode: 'insensitive' } },
        { ciudad: { nombre: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, branches] = await Promise.all([
      this.prisma.sucursal.count({ where }),
      this.prisma.sucursal.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
        include: {
          ciudad: {
            select: {
              id_ciudad: true,
              nombre: true,
              pais: true,
            },
          },
          _count: {
            select: {
              empleado_sucursal: true,
              inventario_sucursal: true,
              movimiento_inventario: true,
              orden_compra: true,
              reserva: true,
            },
          },
        },
      }),
    ]);

    return {
      data: branches.map((b) => {
        const totalHistorial =
          b._count.inventario_sucursal +
          b._count.movimiento_inventario +
          b._count.orden_compra +
          b._count.reserva;

        return {
          id_sucursal: b.id_sucursal,
          nombre: b.nombre,
          direccion: b.direccion,
          telefono: b.telefono,
          hora_apertura: formatTimeToHHmm(b.hora_apertura),
          hora_cierre: formatTimeToHHmm(b.hora_cierre),
          estado: b.estado,
          id_ciudad: b.id_ciudad,
          ciudad: b.ciudad,
          tiene_historial: totalHistorial > 0,
          conteos: {
            empleados: b._count.empleado_sucursal,
            inventario: b._count.inventario_sucursal,
            movimientos: b._count.movimiento_inventario,
            ordenes: b._count.orden_compra,
            reservas: b._count.reserva,
          },
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Consulta una sucursal física por ID, retornando su personal asignado y métricas cuantitativas de actividad.
   *
   * @param {number} id - ID de la sucursal.
   * @returns {Promise<Object>} Detalle de la sucursal y nómina de empleados.
   * @throws {NotFoundException} Si la sucursal no existe.
   */
  async findById(id: number) {
    const branch = await this.prisma.sucursal.findUnique({
      where: { id_sucursal: id },
      include: {
        ciudad: true,
        empleado_sucursal: {
          include: {
            empleado: {
              include: {
                usuario: {
                  select: {
                    email: true,
                    rol: { select: { id_rol: true, nombre: true } },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            empleado_sucursal: true,
            inventario_sucursal: true,
            movimiento_inventario: true,
            orden_compra: true,
            reserva: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`La sucursal con ID ${id} no existe.`);
    }

    const totalHistorial =
      branch._count.inventario_sucursal +
      branch._count.movimiento_inventario +
      branch._count.orden_compra +
      branch._count.reserva;

    return {
      id_sucursal: branch.id_sucursal,
      nombre: branch.nombre,
      direccion: branch.direccion,
      telefono: branch.telefono,
      hora_apertura: formatTimeToHHmm(branch.hora_apertura),
      hora_cierre: formatTimeToHHmm(branch.hora_cierre),
      estado: branch.estado,
      id_ciudad: branch.id_ciudad,
      ciudad: branch.ciudad,
      tiene_historial: totalHistorial > 0,
      empleados: branch.empleado_sucursal.map((es) => ({
        id_empleado: es.empleado.id_empleado,
        nombre: `${es.empleado.nombre} ${es.empleado.apellido}`,
        codigo_empleado: es.empleado.codigo_empleado,
        cargo: es.empleado.usuario?.rol?.nombre || 'Empleado',
        ci: es.empleado.ci,
        email: es.empleado.usuario?.email,
        rol: es.empleado.usuario?.rol?.nombre,
      })),
      metricas: {
        empleados_asignados: branch._count.empleado_sucursal,
        variantes_inventario: branch._count.inventario_sucursal,
        movimientos_registrados: branch._count.movimiento_inventario,
        ordenes_compra: branch._count.orden_compra,
        reservas_recibidas: branch._count.reserva,
      },
    };
  }

  /**
   * Registra una nueva sucursal física:
   * 1. Valida que la ciudad exista.
   * 2. Comprueba que el nombre de sucursal sea único en dicha ciudad.
   * 3. Parsea horas de apertura y cierre a fechas UTC.
   * 4. Registra en la base de datos y añade entrada a la bitácora de auditoría.
   *
   * @param {CreateBranchDto} dto - Datos de la sucursal (nombre, dirección, ciudad, teléfonos, horarios).
   * @param {number} idUsuario - ID del usuario que ejecuta la acción.
   * @param {string} [ip] - Dirección IP de origen.
   * @returns {Promise<Object>} Sucursal creada con horas formateadas a HH:mm.
   * @throws {BadRequestException} Si la ciudad no existe.
   * @throws {ConflictException} Si el nombre de sucursal ya existe en esa ciudad.
   */
  async create(dto: CreateBranchDto, idUsuario: number, ip?: string) {
    const nombre = dto.nombre.trim();
    const direccion = dto.direccion.trim();

    // Validar ciudad existente
    const ciudad = await this.prisma.ciudad.findUnique({
      where: { id_ciudad: dto.id_ciudad },
    });
    if (!ciudad) {
      throw new BadRequestException(
        `La ciudad seleccionada (ID #${dto.id_ciudad}) no existe en el sistema.`,
      );
    }

    // Validar duplicidad de nombre en la misma ciudad
    const conflict = await this.prisma.sucursal.findFirst({
      where: {
        id_ciudad: dto.id_ciudad,
        nombre: { equals: nombre, mode: 'insensitive' },
      },
    });
    if (conflict) {
      throw new ConflictException(
        `Ya existe una sucursal con el nombre "${nombre}" en la ciudad de ${ciudad.nombre}.`,
      );
    }

    const max = await this.prisma.sucursal.aggregate({ _max: { id_sucursal: true } });
    const nextId = (max._max.id_sucursal || 0) + 1;

    const horaAperturaDate = parseTimeStringToDate(dto.hora_apertura);
    const horaCierreDate = parseTimeStringToDate(dto.hora_cierre);

    const created = await this.prisma.sucursal.create({
      data: {
        id_sucursal: nextId,
        nombre,
        direccion,
        telefono: dto.telefono?.trim() || null,
        hora_apertura: horaAperturaDate,
        hora_cierre: horaCierreDate,
        estado: dto.estado || 'activo',
        id_ciudad: dto.id_ciudad,
      },
      include: {
        ciudad: true,
      },
    });

    await this.bitacora.logCreacion(
      'Sucursal',
      `Registró sucursal "${nombre}" en ${ciudad.nombre} con ID #${nextId}`,
      idUsuario,
      ip,
    );

    return {
      message: `Sucursal "${nombre}" creada exitosamente.`,
      data: {
        ...created,
        hora_apertura: formatTimeToHHmm(created.hora_apertura),
        hora_cierre: formatTimeToHHmm(created.hora_cierre),
      },
    };
  }

  /**
   * Actualiza los datos de contacto, ubicación, ciudad u horarios de una sucursal,
   * auditando la modificación en bitácora.
   *
   * @param {number} id - ID de la sucursal.
   * @param {UpdateBranchDto} dto - Datos modificados.
   * @param {number} idUsuario - ID del usuario responsable.
   * @param {string} [ip] - Dirección IP de origen.
   * @returns {Promise<Object>} Sucursal actualizada.
   * @throws {NotFoundException} Si la sucursal no existe.
   * @throws {BadRequestException} Si la ciudad destino no existe.
   * @throws {ConflictException} Si colisiona con el nombre de otra sucursal en la misma ciudad.
   */
  async update(id: number, dto: UpdateBranchDto, idUsuario: number, ip?: string) {
    const existing = await this.prisma.sucursal.findUnique({
      where: { id_sucursal: id },
      include: { ciudad: true },
    });

    if (!existing) {
      throw new NotFoundException(`La sucursal con ID ${id} no existe.`);
    }

    const targetCiudadId = dto.id_ciudad !== undefined ? dto.id_ciudad : existing.id_ciudad;

    if (dto.id_ciudad !== undefined && dto.id_ciudad !== existing.id_ciudad) {
      const targetCiudad = await this.prisma.ciudad.findUnique({
        where: { id_ciudad: dto.id_ciudad },
      });
      if (!targetCiudad) {
        throw new BadRequestException(
          `La ciudad de destino (ID #${dto.id_ciudad}) no existe.`,
        );
      }
    }

    const targetNombre = dto.nombre !== undefined ? dto.nombre.trim() : existing.nombre;

    if (
      targetNombre.toLowerCase() !== existing.nombre.toLowerCase() ||
      targetCiudadId !== existing.id_ciudad
    ) {
      const conflict = await this.prisma.sucursal.findFirst({
        where: {
          id_ciudad: targetCiudadId,
          nombre: { equals: targetNombre, mode: 'insensitive' },
          NOT: { id_sucursal: id },
        },
      });

      if (conflict) {
        throw new ConflictException(
          `Ya existe otra sucursal llamada "${targetNombre}" en la ciudad especificada.`,
        );
      }
    }

    const horaAperturaDate =
      dto.hora_apertura !== undefined
        ? parseTimeStringToDate(dto.hora_apertura)
        : existing.hora_apertura;

    const horaCierreDate =
      dto.hora_cierre !== undefined
        ? parseTimeStringToDate(dto.hora_cierre)
        : existing.hora_cierre;

    const updated = await this.prisma.sucursal.update({
      where: { id_sucursal: id },
      data: {
        nombre: targetNombre,
        direccion: dto.direccion !== undefined ? dto.direccion.trim() : undefined,
        telefono: dto.telefono !== undefined ? dto.telefono?.trim() || null : undefined,
        hora_apertura: horaAperturaDate,
        hora_cierre: horaCierreDate,
        estado: dto.estado !== undefined ? dto.estado : undefined,
        id_ciudad: targetCiudadId,
      },
      include: {
        ciudad: true,
      },
    });

    await this.bitacora.logModificacion(
      'Sucursal',
      `Actualizó datos de sucursal #${id}: "${updated.nombre}" (${updated.ciudad.nombre})`,
      idUsuario,
      ip,
    );

    return {
      message: `Sucursal "${updated.nombre}" actualizada exitosamente.`,
      data: {
        ...updated,
        hora_apertura: formatTimeToHHmm(updated.hora_apertura),
        hora_cierre: formatTimeToHHmm(updated.hora_cierre),
      },
    };
  }

  /**
   * Cambia el estado operativo de una sucursal física (activo / inactivo / mantenimiento).
   *
   * @param {number} id - ID de la sucursal.
   * @param {string} estado - Nuevo estado.
   * @param {number} idUsuario - ID del usuario responsable.
   * @param {string} [ip] - Dirección IP de origen.
   * @returns {Promise<Object>} Sucursal con estado actualizado.
   * @throws {NotFoundException} Si la sucursal no existe.
   */
  async updateStatus(id: number, estado: string, idUsuario: number, ip?: string) {
    const existing = await this.prisma.sucursal.findUnique({
      where: { id_sucursal: id },
    });

    if (!existing) {
      throw new NotFoundException(`La sucursal con ID ${id} no existe.`);
    }

    const updated = await this.prisma.sucursal.update({
      where: { id_sucursal: id },
      data: { estado },
      include: { ciudad: true },
    });

    await this.bitacora.logModificacion(
      'Sucursal',
      `Cambió el estado operativo de sucursal #${id} (${updated.nombre}) a "${estado}"`,
      idUsuario,
      ip,
    );

    return {
      message: `El estado de la sucursal "${updated.nombre}" ahora es "${estado}".`,
      data: {
        ...updated,
        hora_apertura: formatTimeToHHmm(updated.hora_apertura),
        hora_cierre: formatTimeToHHmm(updated.hora_cierre),
      },
    };
  }

  /**
   * Elimina una sucursal física si y solo si no cuenta con historial operativo (inventarios, movimientos,
   * órdenes de compra o reservas previas), preservando así la integridad contable y legal.
   *
   * @param {number} id - ID de la sucursal a eliminar.
   * @param {number} idUsuario - ID del usuario responsable.
   * @param {string} [ip] - Dirección IP de origen.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si la sucursal no existe.
   * @throws {ConflictException} Si la sucursal contiene registros históricos que impiden su borrado.
   */
  async delete(id: number, idUsuario: number, ip?: string) {
    const existing = await this.prisma.sucursal.findUnique({
      where: { id_sucursal: id },
      include: {
        ciudad: true,
        _count: {
          select: {
            inventario_sucursal: true,
            movimiento_inventario: true,
            orden_compra: true,
            reserva: true,
            empleado_sucursal: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`La sucursal con ID ${id} no existe.`);
    }

    const { inventario_sucursal, movimiento_inventario, orden_compra, reserva } =
      existing._count;

    // Regla de Negocio: No eliminar sucursales con historial
    if (
      inventario_sucursal > 0 ||
      movimiento_inventario > 0 ||
      orden_compra > 0 ||
      reserva > 0
    ) {
      const motivos: string[] = [];
      if (inventario_sucursal > 0) motivos.push(`${inventario_sucursal} registro(s) de inventario`);
      if (movimiento_inventario > 0) motivos.push(`${movimiento_inventario} movimiento(s) de stock`);
      if (orden_compra > 0) motivos.push(`${orden_compra} orden(es) de compra`);
      if (reserva > 0) motivos.push(`${reserva} reserva(s) asociadas`);

      throw new ConflictException(
        `La sucursal "${existing.nombre}" no puede eliminarse físicamente porque posee registros históricos operativos: ${motivos.join(', ')}. Para salvaguardar la trazabilidad contable y operativa, desactívela cambiando su estado a "inactivo".`,
      );
    }

    // Si no tiene historial operativo, eliminar enlaces de empleados y luego la sucursal
    if (existing._count.empleado_sucursal > 0) {
      await this.prisma.empleado_sucursal.deleteMany({
        where: { id_sucursal: id },
      });
    }

    await this.prisma.sucursal.delete({
      where: { id_sucursal: id },
    });

    await this.bitacora.logEliminacion(
      'Sucursal',
      `Eliminó físicamente la sucursal #${id} ("${existing.nombre}") de ${existing.ciudad.nombre} (sin historial previo)`,
      idUsuario,
      ip,
    );

    return {
      message: `Sucursal "${existing.nombre}" eliminada exitosamente.`,
    };
  }
}
