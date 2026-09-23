/**
 * @file bitacora.service.ts
 * @description Servicio de auditoría y bitácora del sistema (CU07).
 * Registra eventos clave de seguridad y transaccionales (inicios/cierres de sesión,
 * creaciones, modificaciones, eliminaciones y consultas) con trazabilidad de IP, usuario y entidad afectada.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { QueryBitacoraDto } from '../dto/bitacora.dto.js';

@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Procedimiento nuclear de registro de acción en la tabla de bitácora.
   * Aplica un algoritmo de deduplicación temporal (ventana de 15 min para sesión y 5 min para operaciones)
   * para evitar sobrecargar la base de datos con registros idénticos consecutivos.
   *
   * @param {string} accion - Tipo de acción ejecutada (ej. 'Inicio de Sesion', 'Creó Producto').
   * @param {string} entidadAfectada - Descripción de la entidad o recurso afectado.
   * @param {number} idUsuario - Identificador único del usuario que ejecutó la acción.
   * @param {string} [ip] - Dirección IP de origen de la petición HTTP.
   * @returns {Promise<void>}
   */
  async logAction(
    accion: string,
    entidadAfectada: string,
    idUsuario: number,
    ip?: string,
  ): Promise<void> {
    try {
      // Control de repetición: Evita duplicar la misma acción en la bitácora si no es necesario.
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

      // Calcula el siguiente identificador secuencial
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

  /**
   * Registra el evento de inicio de sesión exitoso de un usuario.
   *
   * @param {number} idUsuario - ID del usuario.
   * @param {string} detalle - Detalles adicionales (ej. correo y dispositivo).
   * @param {string} [ip] - Dirección IP de la conexión.
   */
  async logInicioSesion(idUsuario: number, detalle: string, ip?: string) {
    return this.logAction('Inicio de Sesion', detalle, idUsuario, ip);
  }

  /**
   * Registra el evento de cierre de sesión de un usuario.
   *
   * @param {number} idUsuario - ID del usuario.
   * @param {string} detalle - Detalles del cierre de sesión.
   * @param {string} [ip] - Dirección IP.
   */
  async logCierreSesion(idUsuario: number, detalle: string, ip?: string) {
    return this.logAction('Cierre de Sesion', detalle, idUsuario, ip);
  }

  /**
   * Registra la creación de una entidad o registro en el sistema.
   *
   * @param {string} entidad - Nombre de la entidad creada (ej. 'Producto', 'Empleado').
   * @param {string} detalle - Clave o descripción de la entidad creada.
   * @param {number} idUsuario - ID del usuario responsable.
   * @param {string} [ip] - Dirección IP.
   */
  async logCreacion(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Creó ${entidad}`, detalle, idUsuario, ip);
  }

  /**
   * Registra la modificación o actualización de una entidad.
   *
   * @param {string} entidad - Nombre de la entidad modificada.
   * @param {string} detalle - Clave o resumen de los cambios aplicados.
   * @param {number} idUsuario - ID del usuario responsable.
   * @param {string} [ip] - Dirección IP.
   */
  async logModificacion(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Modificó ${entidad}`, detalle, idUsuario, ip);
  }

  /**
   * Registra la eliminación física o lógica de un registro.
   *
   * @param {string} entidad - Nombre de la entidad eliminada.
   * @param {string} detalle - Identificador o información de la entidad borrada.
   * @param {number} idUsuario - ID del usuario que ejecutó la eliminación.
   * @param {string} [ip] - Dirección IP.
   */
  async logEliminacion(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Eliminó ${entidad}`, detalle, idUsuario, ip);
  }

  /**
   * Registra la consulta sensible o generación de reportes especiales.
   *
   * @param {string} entidad - Recurso o reporte consultado.
   * @param {string} detalle - Criterios o parámetros de consulta.
   * @param {number} idUsuario - ID del usuario que consulta.
   * @param {string} [ip] - Dirección IP.
   */
  async logConsulta(entidad: string, detalle: string, idUsuario: number, ip?: string) {
    return this.logAction(`Consultó ${entidad}`, detalle, idUsuario, ip);
  }

  /**
   * Procedimiento de consulta paginada y filtrado de la bitácora (CU07).
   * Permite filtrar por usuario específico o término general de búsqueda (acción, entidad, nombre del usuario, etc.).
   *
   * @param {QueryBitacoraDto} query - Parámetros de paginación y criterios de búsqueda.
   * @returns {Promise<{ data: any[], meta: { total: number, page: number, limit: number, totalPages: number } }>}
   * Lista de eventos auditados formateados junto con metadatos de paginación.
   */
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
