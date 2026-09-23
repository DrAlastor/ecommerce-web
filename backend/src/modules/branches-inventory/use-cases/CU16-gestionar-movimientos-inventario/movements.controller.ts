/**
 * @file movements.controller.ts
 * @caso-de-uso CU16 — Gestionar movimientos de inventario
 * @subsistema Sucursales e Inventario
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints protegidos por RBAC y alcance multi-sucursal para registrar y auditar
 * los flujos de existencias (entradas, salidas, ajustes de merma y devoluciones) sobre cada sucursal.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { CreateMovementDto, QueryMovementsDto } from './dto/movements.dto.js';
import { MovementsService } from './movements.service.js';

/**
 * Controlador para la gestión y auditoría de transacciones físicas de inventario.
 */
@Controller('branches-inventory/admin/movements')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  /**
   * Obtiene metadatos de referencia (sucursales autorizadas y variantes activas con sus existencias)
   * para desplegar en el modal de registro manual de movimientos.
   *
   * @param {any} req - Objeto Request con usuario autenticado.
   * @returns {Promise<Object>} Sucursales y variantes con sus niveles actuales de stock.
   */
  @Get('metadata')
  @FunctionRequired('Gestionar movimientos de inventario', 'Lectura')
  async getMovementMetadata(@Req() req: any) {
    return this.movementsService.getMovementMetadata(req.user);
  }

  /**
   * Consulta el detalle y responsable de un movimiento específico por su ID.
   *
   * @param {any} req - Objeto Request para validar acceso a la sucursal del movimiento.
   * @param {number} id - Identificador del movimiento de inventario.
   * @returns {Promise<Object>} Ficha técnica del movimiento.
   */
  @Get(':id')
  @FunctionRequired('Gestionar movimientos de inventario', 'Lectura')
  async getMovementDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.movementsService.getMovementDetail(req.user, id);
  }

  /**
   * Consulta el historial paginado de movimientos de inventario según filtros
   * (tipo, sucursal, rango de fechas, texto de búsqueda).
   *
   * @param {any} req - Objeto Request con usuario y sucursales permitidas.
   * @param {QueryMovementsDto} query - Criterios de filtrado y paginación.
   * @returns {Promise<Object>} Movimientos paginados y métricas estadísticas consolidadas.
   */
  @Get()
  @FunctionRequired('Gestionar movimientos de inventario', 'Lectura')
  async getMovements(
    @Req() req: any,
    @Query() query: QueryMovementsDto,
  ) {
    return this.movementsService.getMovements(req.user, query);
  }

  /**
   * Registra un nuevo movimiento manual de inventario (entrada, salida, ajuste, devolución),
   * actualizando atómicamente el stock físico disponible en la sucursal involucrada.
   *
   * @param {any} req - Objeto Request con datos del operador que ejecuta el movimiento.
   * @param {CreateMovementDto} dto - Datos del movimiento (sucursal, variante, tipo, cantidad, motivo).
   * @returns {Promise<Object>} Movimiento registrado, stock anterior y stock resultante.
   */
  @Post()
  @FunctionRequired('Gestionar movimientos de inventario', 'Edicion')
  async createMovement(
    @Req() req: any,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.createMovement(req.user, dto);
  }
}
