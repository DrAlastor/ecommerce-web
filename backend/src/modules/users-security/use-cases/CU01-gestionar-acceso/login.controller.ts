/**
 * @file login.controller.ts
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone el endpoint HTTP para autenticación de credenciales, recepción de DTO y retorno de token JWT y sesión.
 */

import { Body, Controller, HttpCode, HttpStatus, Post, Ip } from '@nestjs/common';
import { LoginService } from './login.service.js';
import { LoginDto } from '../../shared/dto/login.dto.js';

@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  /**
   * Endpoint de inicio de sesión de usuarios (Clientes, Empleados y Administradores).
   * Valida credenciales contra la base de datos, registra el evento en bitácora,
   * activa la sesión en tiempo real y retorna el token JWT junto con el perfil y permisos.
   *
   * @param {LoginDto} loginDto - Objeto de transferencia de datos con correo electrónico y contraseña en texto plano.
   * @param {string} ip - Dirección IP de origen capturada por NestJS.
   * @returns {Promise<LoginResponseDto>} Token Bearer JWT, datos del usuario, rol asignado y lista de funciones autorizadas.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const user = await this.loginService.validateUser(loginDto.email, loginDto.password);
    return this.loginService.login(user, ip);
  }
}
