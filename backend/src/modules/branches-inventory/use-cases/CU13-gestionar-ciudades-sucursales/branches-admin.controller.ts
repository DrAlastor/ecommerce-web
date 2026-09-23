/**
 * @file branches-admin.controller.ts
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Control (API REST) — Backend
 * @responsabilidad Proporciona endpoints protegidos por RBAC y autenticación JWT para la administración de:
 * - Ciudades geográficas de cobertura comercial.
 * - Sucursales físicas (dirección, coordenadas GPS, horarios de apertura, teléfonos, estado operativo).
 * - Registro de bitácora y auditoría de cambios sobre cada entidad física.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { BranchesService } from './branches.service.js';
import { CitiesService } from './cities.service.js';
import {
  CreateBranchDto,
  QueryBranchesDto,
  UpdateBranchDto,
  UpdateBranchStatusDto,
} from './dto/branches.dto.js';
import {
  CreateCityDto,
  QueryCitiesDto,
  UpdateCityDto,
} from './dto/cities.dto.js';

/**
 * Controlador administrativo para el mantenimiento de sucursales físicas y ciudades.
 */
@Controller('branches-inventory/admin')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class BranchesAdminController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly citiesService: CitiesService,
  ) {}

  // ==========================================
  // CIUDADES
  // ==========================================

  /**
   * Obtiene una lista simplificada de ciudades (ID y nombre) para poblar selectores en formularios.
   */
  @Get('cities/simple')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findCitiesSimple() {
    return this.citiesService.findAllSimple();
  }

  /**
   * Lista ciudades con paginación, filtros de búsqueda textual y conteo de sucursales asociadas.
   */
  @Get('cities')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findAllCities(@Query() query: QueryCitiesDto) {
    return this.citiesService.findAll(query);
  }

  /**
   * Consulta una ciudad específica por su identificador primario.
   */
  @Get('cities/:id')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findCityById(@Param('id', ParseIntPipe) id: number) {
    return this.citiesService.findById(id);
  }

  /**
   * Registra una nueva ciudad en la base de datos y audita la acción.
   */
  @Post('cities')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  createCity(@Body() dto: CreateCityDto, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.citiesService.create(dto, idUsuario, ip);
  }

  /**
   * Actualiza el nombre de una ciudad existente y audita la acción.
   */
  @Put('cities/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  updateCity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
    @Req() req: any,
  ) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.citiesService.update(id, dto, idUsuario, ip);
  }

  /**
   * Elimina una ciudad si no tiene sucursales activas vinculadas.
   */
  @Delete('cities/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  deleteCity(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.citiesService.delete(id, idUsuario, ip);
  }

  // ==========================================
  // SUCURSALES
  // ==========================================

  /**
   * Obtiene metadatos de referencia (ciudades disponibles) para formular altas de sucursales.
   */
  @Get('branches/metadata')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  getBranchesMetadata() {
    return this.branchesService.getMetadata();
  }

  /**
   * Lista sucursales con paginación, filtros por ciudad, estado operativo y término de búsqueda.
   */
  @Get('branches')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findAllBranches(@Query() query: QueryBranchesDto) {
    return this.branchesService.findAll(query);
  }

  /**
   * Consulta una sucursal específica con su ciudad y conteos de inventario y empleados.
   */
  @Get('branches/:id')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findBranchById(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findById(id);
  }

  /**
   * Registra una nueva sucursal física en el sistema y audita la operación en bitácora.
   */
  @Post('branches')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  createBranch(@Body() dto: CreateBranchDto, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.create(dto, idUsuario, ip);
  }

  /**
   * Actualiza los datos de dirección, horarios o teléfonos de una sucursal física.
   */
  @Put('branches/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  updateBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
    @Req() req: any,
  ) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.update(id, dto, idUsuario, ip);
  }

  /**
   * Modifica el estado operativo (activo / inactivo / mantenimiento) de una tienda física.
   */
  @Patch('branches/:id/status')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  updateBranchStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchStatusDto,
    @Req() req: any,
  ) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.updateStatus(id, dto.estado, idUsuario, ip);
  }

  /**
   * Elimina una sucursal física si no cuenta con inventario registrado ni empleados asignados.
   */
  @Delete('branches/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  deleteBranch(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.delete(id, idUsuario, ip);
  }
}
