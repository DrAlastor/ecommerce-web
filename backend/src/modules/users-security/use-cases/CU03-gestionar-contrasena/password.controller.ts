/**
 * @file password.controller.ts
 * @caso-de-uso CU03 — Gestionar contraseña
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints para el cambio de contraseña autenticado,
 * solicitud de recuperación vía correo electrónico (Forgot Password) y restablecimiento con token (Reset Password).
 */

import { Controller, Patch, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { PasswordService } from './password.service.js';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

@Controller('auth/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  /**
   * Endpoint para que un usuario autenticado cambie su contraseña voluntariamente.
   * Requiere verificar la contraseña actual antes de aplicar la nueva.
   *
   * @param {any} req - Objeto request con payload JWT del usuario en sesión.
   * @param {ChangePasswordDto} dto - Contraseña actual y nueva contraseña validada.
   * @returns {Promise<{ success: boolean, message: string }>} Confirmación de actualización.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.passwordService.changePassword(req.user.id_usuario, dto);
  }

  /**
   * Endpoint público para solicitar recuperación de contraseña olvidada.
   * Genera un código criptográfico de 6 dígitos con expiración a 15 minutos y lo despacha al correo registrado.
   *
   * @param {ForgotPasswordDto} dto - Correo electrónico del usuario que solicita la recuperación.
   * @returns {Promise<{ success: boolean, message: string }>} Mensaje de confirmación neutro para privacidad.
   */
  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto);
  }

  /**
   * Endpoint público para validar el código recibido y aplicar la nueva contraseña.
   *
   * @param {ResetPasswordDto} dto - Código de verificación o token y nueva contraseña.
   * @returns {Promise<{ success: boolean, message: string }>} Confirmación de contraseña restablecida.
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }
}
