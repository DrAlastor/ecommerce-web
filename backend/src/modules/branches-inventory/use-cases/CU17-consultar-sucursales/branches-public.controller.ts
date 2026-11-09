/**
 * @file branches-public.controller.ts
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints públicos para que los clientes del e-commerce o de la app móvil
 * puedan consultar la red de tiendas físicas de la cadena, sus direcciones, horarios y teléfonos.
 */

import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BranchesPublicService } from './branches-public.service.js';

/**
 * Controlador público para la visualización de tiendas físicas y ciudades de cobertura.
 */
@Controller('branches-inventory/public')
export class BranchesPublicController {
  constructor(private readonly branchesPublicService: BranchesPublicService) {}

  /**
   * Consulta el listado de sucursales activas, permitiendo filtrar por ciudad o búsqueda por término.
   *
   * @param {string} [id_ciudad] - Filtro opcional por ID de ciudad.
   * @param {string} [search] - Filtro opcional de texto para nombre, dirección o ciudad.
   * @returns {Promise<Array>} Lista de tiendas físicas activas con información de contacto y horarios.
   */
  @Get('branches')
  async getActiveBranches(
    @Query('id_ciudad') id_ciudad?: string,
    @Query('search') search?: string,
  ) {
    const cityId = id_ciudad ? parseInt(id_ciudad, 10) : undefined;
    return this.branchesPublicService.getActiveBranches({
      id_ciudad: isNaN(cityId as number) ? undefined : cityId,
      search,
    });
  }

  /**
   * Obtiene la información pública detallada de una tienda física por su ID.
   *
   * @param {number} id - Identificador numérico de la sucursal.
   * @returns {Promise<Object>} Ficha pública de la sucursal.
   */
  @Get('branches/:id')
  async getActiveBranchById(@Param('id', ParseIntPipe) id: number) {
    return this.branchesPublicService.getActiveBranchById(id);
  }

  /**
   * Obtiene las ciudades que tienen al menos una sucursal activa abierta al público.
   *
   * @returns {Promise<Array>} Lista de ciudades con sucursales activas y conteo de tiendas.
   */
  @Get('cities')
  async getActiveCities() {
    return this.branchesPublicService.getActiveCities();
  }
}
