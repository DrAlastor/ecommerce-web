/**
 * @file logout.service.ts
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Procesa la finalización de sesión, marcando al usuario como desconectado
 * en el servicio de presencia y auditando el evento 'Cierre de Sesion' en la bitácora.
 */

import { Injectable } from '@nestjs/common';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { ActiveSessionService } from '../../shared/services/active-session.service.js';

@Injectable()
export class LogoutService {
  constructor(
    private readonly bitacora: BitacoraService,
    private readonly activeSessionService: ActiveSessionService,
  ) {}

  /**
   * Procedimiento de finalización y desconexión de sesión.
   * - Remueve al usuario del mapa en memoria de conexiones activas.
   * - Inserta un registro de auditoría en la tabla `bitacora` con el detalle del usuario e IP.
   *
   * @param {number} [idUsuario] - Identificador único del usuario autenticado.
   * @param {string} [email] - Correo electrónico del usuario para el detalle legible de auditoría.
   * @param {string} [ip] - Dirección IP de origen.
   * @returns {Promise<{ message: string }>} Mensaje de éxito al completar el proceso de logout.
   */
  async logout(idUsuario?: number, email?: string, ip?: string) {
    if (idUsuario) {
      this.activeSessionService.disconnect(idUsuario);
      await this.bitacora.logCierreSesion(
        idUsuario,
        email ? `Usuario: ${email} (ID: ${idUsuario})` : `Usuario ID: ${idUsuario}`,
        ip,
      );
    }
    return { message: 'Sesión finalizada exitosamente' };
  }
}
