import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ActiveSessionService {
  private readonly logger = new Logger(ActiveSessionService.name);

  // Mapa global de usuarios conectados en tiempo real: id_usuario -> timestamp
  // Static para garantizar persistencia y estado compartido unificado
  private static readonly activeUsers = new Map<number, number>();

  // Tiempo límite de expiración de sesión por inactividad (2 horas)
  private readonly SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

  /**
   * Registra a un usuario como conectado cuando inicia sesión exitosamente
   */
  connect(idUsuario: number) {
    ActiveSessionService.activeUsers.set(idUsuario, Date.now());
    this.logger.log(`Usuario ID ${idUsuario} ha iniciado sesión y está CONECTADO.`);
  }

  /**
   * Registra a un usuario como desconectado al cerrar sesión
   */
  disconnect(idUsuario: number) {
    ActiveSessionService.activeUsers.delete(idUsuario);
    this.logger.log(`Usuario ID ${idUsuario} ha cerrado sesión y está DESCONECTADO.`);
  }

  /**
   * Comprueba si el usuario se encuentra conectado actualmente en el sistema
   */
  isConnected(idUsuario: number): boolean {
    const lastSeen = ActiveSessionService.activeUsers.get(idUsuario);
    if (!lastSeen) return false;

    // Verificar si expiró la sesión
    if (Date.now() - lastSeen > this.SESSION_TIMEOUT_MS) {
      ActiveSessionService.activeUsers.delete(idUsuario);
      return false;
    }

    return true;
  }

  /**
   * Actualiza el timestamp de actividad
   */
  touch(idUsuario: number) {
    if (ActiveSessionService.activeUsers.has(idUsuario)) {
      ActiveSessionService.activeUsers.set(idUsuario, Date.now());
    }
  }

  /**
   * Retorna el número de usuarios conectados simultáneamente
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
