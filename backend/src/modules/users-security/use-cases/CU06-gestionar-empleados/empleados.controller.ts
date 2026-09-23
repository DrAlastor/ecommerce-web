/**
 * @file empleados.controller.ts
 * @caso-de-uso CU06 — Gestionar empleados
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints para el CRUD administrativo de personal:
 * registro de nuevos empleados, consulta paginada con filtros de sucursal/rol/estado,
 * obtención de sucursales/roles asignables, actualización de ficha y cambio de estado laboral.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { EmpleadosService } from './empleados.service.js';
import {
  QueryEmployeesDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from './dto/empleados.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';

@Controller('users-security/employees')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  /**
   * Endpoint para listar empleados con filtros dinámicos (texto, rol, sucursal, estado) y paginación.
   * Requiere permiso de 'Lectura' en 'Gestionar empleados'.
   *
   * @param {QueryEmployeesDto} query - Parámetros de búsqueda y paginación.
   * @returns {Promise<{ data: any[], meta: any }>} Listado de empleados con datos de usuario y sucursales.
   */
  @Get()
  @FunctionRequired('Gestionar empleados', 'Lectura')
  findAll(@Query() query: QueryEmployeesDto) {
    return this.empleadosService.findAll(query);
  }

  /**
   * Endpoint para obtener la lista de sucursales físicas activas disponibles para asignación de personal.
   *
   * @returns {Promise<any[]>} Sucursales con nombre, dirección y ciudad.
   */
  @Get('branches')
  @FunctionRequired('Gestionar empleados', 'Lectura')
  getBranches() {
    return this.empleadosService.getBranches();
  }

  /**
   * Endpoint para obtener los roles administrativos aplicables a empleados (excluye 'Cliente').
   *
   * @returns {Promise<any[]>} Roles como Administrador, Encargado de sucursal, Cajero, etc.
   */
  @Get('roles')
  @FunctionRequired('Gestionar empleados', 'Lectura')
  getEmployeeRoles() {
    return this.empleadosService.getEmployeeRoles();
  }

  /**
   * Endpoint para consultar la ficha técnica y laboral completa de un empleado por ID.
   *
   * @param {number} id - ID del empleado.
   * @returns {Promise<any>} Datos personales, código, CI, sucursales asignadas y estado online.
   */
  @Get(':id')
  @FunctionRequired('Gestionar empleados', 'Lectura')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empleadosService.findOne(id);
  }

  /**
   * Endpoint para crear y contratar un nuevo empleado en el sistema.
   * Crea simultáneamente el usuario con credenciales encriptadas y vincula las sucursales asignadas.
   * Requiere permiso de 'Edición' en 'Gestionar empleados'.
   *
   * @param {CreateEmployeeDto} dto - Datos del empleado (nombre, apellido, CI, email, password, rol, sucursales).
   * @param {any} req - Petición con datos del admin responsable.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<any>} Empleado creado.
   */
  @Post()
  @FunctionRequired('Gestionar empleados', 'Edición')
  create(
    @Body() dto: CreateEmployeeDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.empleadosService.create(dto, req.user.id_usuario, ip);
  }

  /**
   * Endpoint para actualizar los datos personales, rol o sucursales de un empleado.
   * Requiere permiso de 'Edición' en 'Gestionar empleados'.
   *
   * @param {number} id - ID del empleado a modificar.
   * @param {UpdateEmployeeDto} dto - Datos a actualizar.
   * @param {any} req - Petición con identidad del admin.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<any>} Empleado actualizado.
   */
  @Put(':id')
  @FunctionRequired('Gestionar empleados', 'Edición')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.empleadosService.update(id, dto, req.user.id_usuario, ip);
  }

  /**
   * Endpoint para cambiar el estado operativo/laboral del empleado (Activo, Inactivo, Vacaciones, etc.).
   * Sincroniza automáticamente el estado en la tabla de usuarios vinculada.
   * Requiere permiso de 'Edición' en 'Gestionar empleados'.
   *
   * @param {number} id - ID del empleado.
   * @param {UpdateEmployeeStatusDto} dto - Nuevo estado.
   * @param {any} req - Petición con datos del admin.
   * @param {string} ip - Dirección IP.
   * @returns {Promise<any>} Confirmación del cambio de estado.
   */
  @Patch(':id/status')
  @FunctionRequired('Gestionar empleados', 'Edición')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.empleadosService.updateStatus(id, dto, req.user.id_usuario, ip);
  }
}
