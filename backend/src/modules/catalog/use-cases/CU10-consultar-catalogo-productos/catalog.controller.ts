import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { QueryCatalogDto } from './dto/catalog.dto.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * CU10 — Consultar catálogo de productos con filtros, búsqueda, ordenamiento y paginación
   */
  @Get('products')
  async getCatalog(@Query() query: QueryCatalogDto) {
    return this.catalogService.getCatalog(query);
  }

  /**
   * Obtiene metadatos de filtros (categorías, colecciones, tallas, colores, rangos de precio)
   */
  @Get('filters')
  async getFilters() {
    return this.catalogService.getFilterMetadata();
  }
}
