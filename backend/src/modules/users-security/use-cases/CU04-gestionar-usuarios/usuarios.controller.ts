/**
 * @file usuarios.controller.ts
 * @caso-de-uso CU04 — Gestionar usuarios
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints protegidos para que los administradores listen usuarios,
 * consulten detalles, cambien el estado de la cuenta (activo/inactivo) y actualicen roles o emails.
 */

import { Controller, Get, Param, ParseIntPipe, Patch, Put, Body, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { QueryUsersDto, UpdateUserStatusDto, UpdateUserAdminDto } from './dto/usuarios.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';

@Controller('users-security/users')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Endpoint para listar usuarios del sistema con filtros de búsqueda, estado, rol y paginación.
   * Requiere permiso de 'Lectura' en 'Gestionar usuarios'. Registra la consulta en bitácora.
   *
   * @param {QueryUsersDto} query - Criterios de filtrado y parámetros de paginación.
   * @param {any} req - Petición HTTP con datos del administrador solicitante.
   * @param {string} ip - Dirección IP de origen.
   * @returns {Promise<{ data: any[], meta: any }>} Listado paginado de usuarios con presencia online.
   */
  @Get()
  @FunctionRequired('Gestionar usuarios', 'Lectura')
  findAll(@Query() query: QueryUsersDto, @Req() req: any, @Ip() ip: string) {
    if (req.user?.id_usuario) {
      this.usuariosService.logConsultaUsers(req.user.id_usuario, ip);
    }
    return this.usuariosService.findAll(query);
  }

  /**
   * Endpoint para obtener el detalle exhaustivo de un usuario por su ID.
   *
   * @param {number} id - Identificador único del usuario a consultar.
   * @param {any} req - Petición HTTP con datos del administrador.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<any>} Perfil, rol, estado de conexión y datos de cliente o empleado.
   */
  @Get(':id')
  @FunctionRequired('Gestionar usuarios', 'Lectura')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Ip() ip: string) {
    if (req.user?.id_usuario) {
      this.usuariosService.logConsultaUserDetail(id, req.user.id_usuario, ip);
    }
    return this.usuariosService.findOne(id);
  }

  /**
   * Endpoint para activar o suspender/desactivar la cuenta de un usuario.
   * Requiere permiso de 'Edición' en 'Gestionar usuarios'.
   *
   * @param {number} id - ID del usuario cuyo estado cambiará.
   * @param {UpdateUserStatusDto} dto - Nuevo estado ('activo' o 'inactivo').
   * @param {any} req - Petición con datos del admin responsable.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<{ message: string, estado: string }>} Confirmación del nuevo estado.
   */
  @Patch(':id/status')
  @FunctionRequired('Gestionar usuarios', 'Edición')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.usuariosService.updateStatus(id, dto, req.user.id_usuario, ip);
  }

  /**
   * Endpoint administrativo para modificar el rol o el correo electrónico de un usuario.
   * Valida unicidad del nuevo correo antes de actualizar.
   *
   * @param {number} id - ID del usuario a modificar.
   * @param {UpdateUserAdminDto} dto - Nuevo email y/o nuevo ID de rol.
   * @param {any} req - Petición con datos del admin.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<{ message: string, usuario: any }>} Usuario actualizado.
   */
  @Put(':id')
  @FunctionRequired('Gestionar usuarios', 'Edición')
  updateAdminData(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.usuariosService.updateAdminData(id, dto, req.user.id_usuario, ip);
  }
}
