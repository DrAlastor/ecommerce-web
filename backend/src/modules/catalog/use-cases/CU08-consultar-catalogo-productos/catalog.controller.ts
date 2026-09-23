/**
 * @file catalog.controller.ts
 * @caso-de-uso CU08 — Consultar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints públicos para explorar el catálogo de prendas,
 * aplicar filtros combinados (categoría, color, talla, rango de precio, rebajas/promociones, solo 3D) y metadatos de filtros.
 */

import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { QueryCatalogDto } from './dto/catalog.dto.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Endpoint público para consultar el catálogo de productos con búsqueda inteligente,
   * filtros avanzados, ordenamiento y paginación.
   *
   * @param {QueryCatalogDto} query - DTO con parámetros de búsqueda, categoría, color, talla, precios, rebajas y orden.
   * @returns {Promise<{ data: any[], meta: any }>} Listado de productos con precios promocionales y metadatos de paginación.
   */
  @Get('products')
  async getCatalog(@Query() query: QueryCatalogDto) {
    return this.catalogService.getCatalog(query);
  }

  /**
   * Endpoint público para obtener las opciones dinámicas de filtrado disponibles en la tienda
   * (categorías con productos activos, colecciones, tallas, paleta de colores y rango min/max de precios).
   *
   * @returns {Promise<any>} Objeto con listas de filtros para poblar la barra lateral del catálogo.
   */
  @Get('filters')
  async getFilters() {
    return this.catalogService.getFilterMetadata();
  }
}
