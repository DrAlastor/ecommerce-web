import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { QueryBitacoraDto } from '../dto/bitacora.dto.js';

@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    accion: string,
    entidadAfectada: string,
    idUsuario: number,
    ip?: string,
  ): Promise<void> {
    try {
      // Control de repetición: Evita duplicar la misma acción en la bitácora si no es necesario.
      // Si la misma acción sobre la misma entidad fue registrada por el usuario recientemente, se descarta.
      const isLoginOrLogout = accion.includes('Sesion');
      const windowMs = isLoginOrLogout ? 15 * 60 * 1000 : 5 * 60 * 1000;
      const recentWindow = new Date(Date.now() - windowMs);

      const recentLog = await this.prisma.bitacora.findFirst({
        where: {
          id_usuario: idUsuario,
          accion,
          entidad_afectada: entidadAfectada,
          fecha_hora: { gte: recentWindow },
        },
        orderBy: { id_bitacora: 'desc' },
      });

      if (recentLog) {
        // Ya existe un registro idéntico reciente; evitamos saturar la bitácora con repeticiones
        return;
      }

      // Find the next id since it doesn't have autoincrement configured in prisma
      const lastLog = await this.prisma.bitacora.findFirst({
        orderBy: { id_bitacora: 'desc' },
      });
      const nextId = lastLog ? lastLog.id_bitacora + 1 : 1;

      await this.prisma.bitacora.create({
        data: {
          id_bitacora: nextId,
          accion,
          entidad_afectada: entidadAfectada,
          ip: ip || null,
          id_usuario: idUsuario,
        },
      });
    } catch (error) {
      this.logger.error(`Error logging to bitacora: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async logInicioSesion(idUsuario: number, detalle: string, ip?: string) {
    return this.logAction('Inicio de Sesion', detalle, idUsuario, ip);
  }

  async logCierreSesion(idUsuario: number, detalle: string, ip?: string) {
    return this.logAction('Cierre de Sesion', detalle, idUsuario, ip);
  }

  async logCreacion(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Creó ${entidad}`, detalle, idUsuario, ip);
  }

  async logModificacion(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Modificó ${entidad}`, detalle, idUsuario, ip);
  }

  async logEliminacion(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Eliminó ${entidad}`, detalle, idUsuario, ip);
  }

  async logConsulta(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Consultó ${entidad}`, detalle, idUsuario, ip);
  }

  async findAll(query: QueryBitacoraDto) {
    const { search, id_usuario, page = 1, limit = 15 } = query;

    const where: any = {
      ...(id_usuario && { id_usuario }),
      ...(search && {
        OR: [
          { accion: { contains: search, mode: 'insensitive' } },
          { entidad_afectada: { contains: search, mode: 'insensitive' } },
          { usuario: { email: { contains: search, mode: 'insensitive' } } },
          { usuario: { empleado: { nombre: { contains: search, mode: 'insensitive' } } } },
          { usuario: { empleado: { apellido: { contains: search, mode: 'insensitive' } } } },
          { usuario: { cliente: { nombre: { contains: search, mode: 'insensitive' } } } },
          { usuario: { cliente: { apellido: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const total = await this.prisma.bitacora.count({ where });

    const logs = await this.prisma.bitacora.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        usuario: {
          include: {
            rol: true,
            empleado: true,
            cliente: true,
          },
        },
      },
      orderBy: { id_bitacora: 'desc' },
    });

    return {
      data: logs.map((log) => {
        let nombreUsuario = log.usuario?.email || `Usuario #${log.id_usuario}`;
        if (log.usuario?.empleado) {
          nombreUsuario = `${log.usuario.empleado.nombre} ${log.usuario.empleado.apellido}`;
        } else if (log.usuario?.cliente) {
          nombreUsuario = `${log.usuario.cliente.nombre} ${log.usuario.cliente.apellido}`;
        }

        return {
          id_bitacora: log.id_bitacora,
          accion: log.accion,
          fecha_hora: log.fecha_hora,
          entidad_afectada: log.entidad_afectada,
          ip: log.ip,
          id_usuario: log.id_usuario,
          usuario: {
            email: log.usuario?.email,
            nombre: nombreUsuario,
            rol: log.usuario?.rol?.nombre || 'Desconocido',
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
}

