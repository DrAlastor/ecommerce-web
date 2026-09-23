/**
 * @file profile.controller.ts
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints para el registro público de nuevos clientes (sign-up),
 * consulta de perfil personal del usuario autenticado y actualización de sus datos personales.
 */

import { Controller, Get, Post, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RegisterClienteDto } from './dto/register-cliente.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Endpoint público de auto-registro de nuevos clientes (creación de cuenta).
   * Valida unicidad de correo y CI, aplica hashing a la contraseña y asigna el rol 'Cliente'.
   *
   * @param {RegisterClienteDto} dto - Datos del nuevo cliente (nombre, apellido, email, contraseña, CI).
   * @returns {Promise<Omit<Usuario, 'password_hash'>>} Cuenta creada sin información sensible.
   */
  @Post('register')
  async register(@Body() dto: RegisterClienteDto) {
    return this.profileService.registerCliente(dto);
  }

  /**
   * Endpoint de consulta del perfil del usuario en sesión.
   * Requiere autenticación JWT. Retorna información del usuario, rol, cliente/empleado y funciones autorizadas.
   *
   * @param {any} req - Objeto de petición HTTP con el payload de identidad del token JWT.
   * @returns {Promise<{ user: any, rol: any, funciones: any[] }>} Perfil completo y permisos.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { id_usuario: number } }) {
    return this.profileService.getProfile(req.user.id_usuario);
  }

  /**
   * Endpoint de actualización de datos del perfil propio (Cliente o Empleado).
   * Requiere autenticación JWT. Permite modificar nombres, apellidos, teléfono, preferencias o fecha de nacimiento.
   *
   * @param {any} req - Objeto de petición con identidad del usuario autenticado.
   * @param {UpdateProfileDto} dto - Campos a actualizar.
   * @returns {Promise<Cliente | Empleado>} Perfil actualizado.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: { user: { id_usuario: number } }, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id_usuario, dto);
  }
}
