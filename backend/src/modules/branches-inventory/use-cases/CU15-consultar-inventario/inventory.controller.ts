/**
 * @file inventory.controller.ts
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints protegidos por RBAC y alcance multi-sucursal para consultar
 * las existencias físicas de variantes, niveles de stock mínimo, reservas activas y alertas de desabastecimiento.
 */

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { QueryInventoryDto } from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

/**
 * Controlador administrativo para la inspección y análisis del inventario de sucursales físicas.
 */
@Controller('branches-inventory/admin/inventory')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Obtiene metadatos para poblar filtros de inventario (sucursales autorizadas según el rol del empleado,
   * tallas, colores y categorías activas).
   *
   * @param {any} req - Objeto Request con datos de usuario autenticado.
   * @returns {Promise<Object>} Metadatos de sucursales autorizadas y atributos de variantes.
   */
  @Get('metadata')
  @FunctionRequired('Gestionar inventario', 'Lectura')
  async getMetadata(@Req() req: any) {
    return this.inventoryService.getMetadata(req.user);
  }

  /**
   * Consulta existencias de inventario con filtros por sucursal, talla, color, estado de stock
   * (disponible, bajo, agotado) y búsqueda libre de SKU o nombre de producto.
   *
   * @param {any} req - Objeto Request con usuario y sucursales permitidas.
   * @param {QueryInventoryDto} query - Filtros y parámetros de paginación.
   * @returns {Promise<Object>} Lista de existencias por sucursal, métricas estadísticas y paginación.
   */
  @Get()
  @FunctionRequired('Gestionar inventario', 'Lectura')
  async getInventory(@Req() req: any, @Query() query: QueryInventoryDto) {
    return this.inventoryService.getInventory(req.user, query);
  }

  /**
   * Obtiene el detalle exhaustivo de un registro específico de inventario en una sucursal.
   *
   * @param {any} req - Objeto Request para validar privilegios sobre la sucursal del ítem.
   * @param {number} id - Identificador único numérico del registro de inventario_sucursal.
   * @returns {Promise<Object>} Registro detallado con variante, producto y ubicación.
   */
  @Get(':id')
  @FunctionRequired('Gestionar inventario', 'Lectura')
  async getInventoryDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventoryService.getInventoryDetail(req.user, id);
  }
}
