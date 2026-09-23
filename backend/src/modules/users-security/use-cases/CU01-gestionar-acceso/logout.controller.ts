/**
 * @file logout.controller.ts
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone el endpoint HTTP protegido para finalización de sesión y desconexión de usuario.
 */

import { Controller, HttpCode, HttpStatus, Post, UseGuards, Req, Ip } from '@nestjs/common';
import { LogoutService } from './logout.service.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

@Controller('auth')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  /**
   * Endpoint de cierre de sesión (Logout).
   * Requiere token Bearer JWT activo. Registra la desconexión en la bitácora y libera la sesión en memoria.
   *
   * @param {any} req - Objeto de petición HTTP conteniendo el usuario decodificado por JwtAuthGuard.
   * @param {string} ip - Dirección IP de origen de la solicitud de desconexión.
   * @returns {Promise<{ message: string }>} Mensaje de confirmación de cierre de sesión exitoso.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Ip() ip: string) {
    return this.logoutService.logout(req.user?.id_usuario, req.user?.email, ip);
  }
}
