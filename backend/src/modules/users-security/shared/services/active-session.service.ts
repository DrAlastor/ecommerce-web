/**
 * @file active-session.service.ts
 * @description Servicio de gestión y monitoreo de sesiones activas en tiempo real.
 * Mantiene un registro en memoria de los usuarios actualmente conectados al sistema,
 * controlando tiempos de expiración por inactividad y métricas de concurrencia.
 */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ActiveSessionService {
  private readonly logger = new Logger(ActiveSessionService.name);

  /**
   * Mapa estático global de usuarios conectados: id_usuario -> timestamp (milisegundos).
   * Al ser estático, garantiza un estado compartido en memoria entre todas las instancias del servicio.
   */
  private static readonly activeUsers = new Map<number, number>();

  /**
   * Tiempo límite de inactividad antes de considerar la sesión como expirada (2 horas).
   */
  private readonly SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

  /**
   * Registra a un usuario como conectado activamente en el sistema.
   * Se invoca inmediatamente tras un inicio de sesión exitoso.
   *
   * @param {number} idUsuario - Identificador único del usuario autenticado.
   */
  connect(idUsuario: number): void {
    ActiveSessionService.activeUsers.set(idUsuario, Date.now());
    this.logger.log(`Usuario ID ${idUsuario} ha iniciado sesión y está CONECTADO.`);
  }

  /**
   * Remueve a un usuario del registro de sesiones activas.
   * Se invoca cuando el usuario cierra sesión explícitamente (Logout).
   *
   * @param {number} idUsuario - Identificador único del usuario a desconectar.
   */
  disconnect(idUsuario: number): void {
    ActiveSessionService.activeUsers.delete(idUsuario);
    this.logger.log(`Usuario ID ${idUsuario} ha cerrado sesión y está DESCONECTADO.`);
  }

  /**
   * Comprueba si un usuario específico tiene una sesión activa válida y no expirada.
   * Si la sesión ha superado el tiempo límite de inactividad, se purga del mapa automáticamente.
   *
   * @param {number} idUsuario - Identificador único del usuario a consultar.
   * @returns {boolean} True si el usuario está conectado y activo; false en caso contrario.
   */
  isConnected(idUsuario: number): boolean {
    const lastSeen = ActiveSessionService.activeUsers.get(idUsuario);
    if (!lastSeen) return false;

    // Verificar si expiró la sesión por tiempo de inactividad
    if (Date.now() - lastSeen > this.SESSION_TIMEOUT_MS) {
      ActiveSessionService.activeUsers.delete(idUsuario);
      return false;
    }

    return true;
  }

  /**
   * Actualiza la marca de tiempo de última actividad ('touch') de un usuario conectado.
   * Extiende la vigencia de la sesión en memoria.
   *
   * @param {number} idUsuario - Identificador único del usuario en actividad.
   */
  touch(idUsuario: number): void {
    if (ActiveSessionService.activeUsers.has(idUsuario)) {
      ActiveSessionService.activeUsers.set(idUsuario, Date.now());
    }
  }

  /**
   * Obtiene la cantidad total de usuarios conectados en el momento actual.
   * Purga previamente todas las sesiones inactivas que hayan superado el timeout.
   *
   * @returns {number} Número de sesiones activas en tiempo real.
   */
  getConnectedCount(): number {
    const now = Date.now();
    for (const [id, lastSeen] of ActiveSessionService.activeUsers.entries()) {
      if (now - lastSeen > this.SESSION_TIMEOUT_MS) {
        ActiveSessionService.activeUsers.delete(id);
      }
    }
    return ActiveSessionService.activeUsers.size;
  }
}
