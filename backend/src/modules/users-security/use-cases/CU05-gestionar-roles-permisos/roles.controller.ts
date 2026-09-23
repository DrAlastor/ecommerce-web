/**
 * @file roles.controller.ts
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints para la administración de la matriz RBAC:
 * consulta del listado de roles con conteo de usuarios/funciones, árbol de módulos y actualización de permisos por rol.
 */

import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { UpdateRolePermissionsDto } from './dto/roles.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';

@Controller('users-security/roles')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Endpoint para listar todos los roles del sistema con métricas de usuarios y permisos vinculados.
   * Requiere permiso de 'Lectura' en 'Gestionar roles'.
   *
   * @returns {Promise<any[]>} Lista de roles con totales agregados.
   */
  @Get()
  @FunctionRequired('Gestionar roles', 'Lectura')
  getRoles() {
    return this.rolesService.getRoles();
  }

  /**
   * Endpoint para obtener el árbol jerárquico de módulos del sistema y sus funciones hijas.
   * Utilizado por el configurador de permisos en el panel de administración.
   *
   * @returns {Promise<any[]>} Módulos con sus listas de funciones asociadas.
   */
  @Get('modules-tree')
  @FunctionRequired('Gestionar roles', 'Lectura')
  getModulesTree() {
    return this.rolesService.getModulesTree();
  }

  /**
   * Endpoint para consultar el detalle de un rol por su ID, incluyendo sus funciones asignadas y nivel de acceso (Lectura/Edición).
   *
   * @param {number} id - Identificador único del rol.
   * @returns {Promise<any>} Objeto de rol con resumen y array de funciones.
   */
  @Get(':id')
  @FunctionRequired('Gestionar roles', 'Lectura')
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  /**
   * Endpoint para actualizar en bloque los permisos de un rol (matriz ROL_FUNCION).
   * Requiere permiso de 'Edición' en 'Gestionar roles'.
   *
   * @param {number} id - ID del rol a modificar.
   * @param {UpdateRolePermissionsDto} dto - Array de funciones con nivel de acceso ('Lectura' o 'Edición').
   * @param {any} req - Petición con identidad del administrador.
   * @param {string} ip - Dirección IP de origen.
   * @returns {Promise<any>} Rol actualizado con sus nuevos permisos.
   */
  @Put(':id/permissions')
  @FunctionRequired('Gestionar roles', 'Edición')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolePermissionsDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.rolesService.updateRolePermissions(
      id,
      dto,
      req.user.id_usuario,
      ip,
    );
  }
}
