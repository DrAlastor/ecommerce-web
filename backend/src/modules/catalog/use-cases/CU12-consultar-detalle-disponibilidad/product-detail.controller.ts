/**
 * @file product-detail.controller.ts
 * @caso-de-uso CU09 — Consultar detalle y disponibilidad de producto
 * @subsistema Catálogo e Inventario
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints públicos para consultar la ficha técnica completa de un producto,
 * sus variantes por color y talla, guía de medidas y la disponibilidad de stock discriminada por cada sucursal física.
 */

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductDetailService } from './product-detail.service.js';
import type { ProductDetailResponseDto } from './dto/product-detail.dto.js';

/**
 * Controlador REST para la consulta detallada de productos y existencias por tienda.
 */
@Controller('catalog/products')
export class ProductDetailController {
  constructor(private readonly productDetailService: ProductDetailService) {}

  /**
   * Obtiene la información exhaustiva de un producto: imágenes, colección, guía de tallas,
   * variantes activas, promociones vigentes aplicables y el stock en cada una de las sucursales.
   *
   * @param {number} id - Identificador único numérico del producto en la base de datos.
   * @returns {Promise<ProductDetailResponseDto>} Ficha técnica detallada con inventario y precios calculados.
   */
  @Get(':id')
  async getProductDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductDetailResponseDto> {
    return this.productDetailService.getProductDetail(id);
  }
}
