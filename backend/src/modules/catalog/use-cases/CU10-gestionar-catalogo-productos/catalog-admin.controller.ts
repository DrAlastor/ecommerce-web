/**
 * @file catalog-admin.controller.ts
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control (API REST) — Backend
 * @responsabilidad Proporciona endpoints protegidos por autenticación JWT y control de acceso basado
 * en roles (RBAC) para la administración centralizada de:
 * - Metadatos auxiliares de catálogo.
 * - Productos y variantes (tallas, colores, precios, SKUs, modelos 3D).
 * - Galería de imágenes y designación de portada principal.
 * - Categorías jerárquicas y guías de tallas.
 * - Tallas, colores, temporadas y colecciones.
 * - Promociones comerciales y asignación masiva de productos participantes.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CatalogAdminService } from './catalog-admin.service.js';
import {
  QueryAdminProductsDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateStatusDto,
  CreateVariantDto,
  UpdateVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSizeDto,
  CreateColorDto,
  UpdateColorDto,
  CreateSeasonDto,
  UpdateSeasonDto,
  CreateCollectionDto,
  UpdateCollectionDto,
  CreateSizeGuideDto,
  UpdateSizeGuideDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  AssignPromotionProductsDto,
  CreateProductImageDto,
} from './dto/catalog-admin.dto.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';

/**
 * Controlador de gestión administrativa integral de catálogo de productos y maestros comerciales.
 */
@Controller('catalog/admin')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  // ==========================================
  // METADATA
  // ==========================================

  /**
   * Obtiene listas de referencia consolidadas (categorías, tallas, colores, temporadas y colecciones)
   * para precargar desplegables y modales de creación/edición en el panel de administración.
   */
  @Get('metadata')
  @FunctionRequired('Gestionar productos', 'Lectura')
  getMetadata() {
    return this.catalogAdminService.getMetadata();
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  /**
   * Lista productos con soporte para búsqueda textual, filtros por categoría, colección, género,
   * estado operativo y paginación con conteo de variantes asociadas.
   */
  @Get('products')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllProducts(@Query() query: QueryAdminProductsDto) {
    return this.catalogAdminService.findAllProducts(query);
  }

  /**
   * Consulta el registro de un producto específico por ID, incluyendo variantes, imágenes y promociones.
   */
  @Get('products/:id')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findProductById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.findProductById(id);
  }

  /**
   * Registra un nuevo producto base en el catálogo mercantil.
   */
  @Post('products')
  @FunctionRequired('Gestionar productos', 'Edición')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogAdminService.createProduct(dto);
  }

  /**
   * Actualiza la información descriptiva, precio base, categoría o colección de un producto.
   */
  @Put('products/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.catalogAdminService.updateProduct(id, dto);
  }

  /**
   * Cambia el estado de un producto (activo / inactivo / descontinuado).
   */
  @Patch('products/:id/status')
  @FunctionRequired('Gestionar productos', 'Edición')
  toggleProductStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.catalogAdminService.toggleProductStatus(id, dto.estado);
  }

  // ==========================================
  // VARIANTS
  // ==========================================

  /**
   * Lista todas las variantes de un producto (combinaciones de talla y color, SKU, inventario y 3D).
   */
  @Get('products/:id/variants')
  @FunctionRequired('Gestionar variantes', 'Lectura')
  findVariantsByProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.findVariantsByProduct(id);
  }

  /**
   * Crea una nueva variante para un producto específico, validando unicidad de SKU y combinación talla/color.
   */
  @Post('products/:id/variants')
  @FunctionRequired('Gestionar variantes', 'Edición')
  createVariant(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateVariantDto,
  ) {
    return this.catalogAdminService.createVariant(productId, dto);
  }

  /**
   * Modifica los datos de una variante existente (SKU, precios adicionales, URLs multimedia 3D).
   */
  @Put('variants/:id')
  @FunctionRequired('Gestionar variantes', 'Edición')
  updateVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.catalogAdminService.updateVariant(id, dto);
  }

  /**
   * Cambia el estado de una variante (activo / inactivo).
   */
  @Patch('variants/:id/status')
  @FunctionRequired('Gestionar variantes', 'Edición')
  toggleVariantStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.catalogAdminService.toggleVariantStatus(id, dto.estado);
  }

  // ==========================================
  // PRODUCT IMAGES
  // ==========================================

  /**
   * Asocia una nueva imagen a la galería multimedia del producto.
   */
  @Post('products/:id/images')
  @FunctionRequired('Gestionar productos', 'Edición')
  addProductImage(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.catalogAdminService.addProductImage(productId, dto);
  }

  /**
   * Elimina un registro de imagen de la galería de un producto.
   */
  @Delete('images/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteProductImage(@Param('id', ParseIntPipe) imageId: number) {
    return this.catalogAdminService.deleteProductImage(imageId);
  }

  /**
   * Establece una imagen particular como la portada principal del producto.
   */
  @Patch('products/:productId/images/:imageId/main')
  @FunctionRequired('Gestionar productos', 'Edición')
  setMainProductImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.catalogAdminService.setMainProductImage(productId, imageId);
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  /**
   * Lista todas las categorías comerciales registradas con conteo de productos vinculados.
   */
  @Get('categories')
  @FunctionRequired('Gestionar categorias', 'Lectura')
  findAllCategories() {
    return this.catalogAdminService.findAllCategories();
  }

  /**
   * Registra una nueva categoría de producto en el sistema.
   */
  @Post('categories')
  @FunctionRequired('Gestionar categorias', 'Edición')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogAdminService.createCategory(dto);
  }

  /**
   * Actualiza los datos informativos de una categoría existente.
   */
  @Put('categories/:id')
  @FunctionRequired('Gestionar categorias', 'Edición')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogAdminService.updateCategory(id, dto);
  }

  /**
   * Elimina una categoría si no posee productos activos vinculados.
   */
  @Delete('categories/:id')
  @FunctionRequired('Gestionar categorias', 'Edición')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteCategory(id);
  }

  // ==========================================
  // SIZES
  // ==========================================

  /**
   * Obtiene la lista completa de tallas estándar (XS, S, M, L, etc.).
   */
  @Get('sizes')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllSizes() {
    return this.catalogAdminService.findAllSizes();
  }

  /**
   * Registra un nuevo código de talla en el catálogo.
   */
  @Post('sizes')
  @FunctionRequired('Gestionar productos', 'Edición')
  createSize(@Body() dto: CreateSizeDto) {
    return this.catalogAdminService.createSize(dto);
  }

  /**
   * Elimina una talla si no está en uso por variantes existentes.
   */
  @Delete('sizes/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteSize(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteSize(id);
  }

  // ==========================================
  // COLORS
  // ==========================================

  /**
   * Obtiene la lista de colores registrados con su nombre y valor hexadecimal.
   */
  @Get('colors')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllColors() {
    return this.catalogAdminService.findAllColors();
  }

  /**
   * Registra un nuevo color para uso en variantes.
   */
  @Post('colors')
  @FunctionRequired('Gestionar productos', 'Edición')
  createColor(@Body() dto: CreateColorDto) {
    return this.catalogAdminService.createColor(dto);
  }

  /**
   * Actualiza el nombre o código hexadecimal de un color.
   */
  @Put('colors/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateColor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColorDto,
  ) {
    return this.catalogAdminService.updateColor(id, dto);
  }

  /**
   * Elimina un color si no está vinculado a variantes de productos.
   */
  @Delete('colors/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteColor(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteColor(id);
  }

  // ==========================================
  // SEASONS
  // ==========================================

  /**
   * Lista todas las temporadas registradas (Verano, Invierno, etc.) con sus fechas de vigencia.
   */
  @Get('seasons')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllSeasons() {
    return this.catalogAdminService.findAllSeasons();
  }

  /**
   * Registra una nueva temporada de moda en el catálogo.
   */
  @Post('seasons')
  @FunctionRequired('Gestionar productos', 'Edición')
  createSeason(@Body() dto: CreateSeasonDto) {
    return this.catalogAdminService.createSeason(dto);
  }

  /**
   * Actualiza datos y vigencia temporal de una temporada.
   */
  @Put('seasons/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateSeason(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSeasonDto,
  ) {
    return this.catalogAdminService.updateSeason(id, dto);
  }

  // ==========================================
  // COLLECTIONS
  // ==========================================

  /**
   * Lista todas las colecciones temáticas registradas junto con su temporada asignada.
   */
  @Get('collections')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllCollections() {
    return this.catalogAdminService.findAllCollections();
  }

  /**
   * Crea una nueva colección temática vinculada a una temporada.
   */
  @Post('collections')
  @FunctionRequired('Gestionar productos', 'Edición')
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.catalogAdminService.createCollection(dto);
  }

  /**
   * Actualiza los datos informativos de una colección existente.
   */
  @Put('collections/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateCollection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.catalogAdminService.updateCollection(id, dto);
  }

  /**
   * Elimina una colección si no contiene productos dependientes.
   */
  @Delete('collections/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteCollection(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteCollection(id);
  }

  // ==========================================
  // SIZE GUIDES
  // ==========================================

  /**
   * Lista guías de tallas (medidas en cm por parte del cuerpo), opcionalmente filtradas por categoría.
   */
  @Get('size-guides')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllSizeGuides(@Query('id_categoria') id_categoria?: string) {
    const catId = id_categoria ? parseInt(id_categoria, 10) : undefined;
    return this.catalogAdminService.findAllSizeGuides(catId);
  }

  /**
   * Agrega un nuevo registro a la guía de tallas de una categoría.
   */
  @Post('size-guides')
  @FunctionRequired('Gestionar productos', 'Edición')
  createSizeGuide(@Body() dto: CreateSizeGuideDto) {
    return this.catalogAdminService.createSizeGuide(dto);
  }

  /**
   * Actualiza las medidas de un registro existente de guía de tallas.
   */
  @Put('size-guides/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateSizeGuide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSizeGuideDto,
  ) {
    return this.catalogAdminService.updateSizeGuide(id, dto);
  }

  /**
   * Elimina una regla específica de la guía de tallas.
   */
  @Delete('size-guides/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteSizeGuide(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteSizeGuide(id);
  }

  // ==========================================
  // PROMOTIONS
  // ==========================================

  /**
   * Lista todas las promociones y campañas de descuento registradas con estadísticas de uso y productos vinculados.
   */
  @Get('promotions')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllPromotions() {
    return this.catalogAdminService.findAllPromotions();
  }

  /**
   * Crea una nueva campaña de descuento promocional (porcentaje o monto fijo).
   */
  @Post('promotions')
  @FunctionRequired('Gestionar productos', 'Edición')
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.catalogAdminService.createPromotion(dto);
  }

  /**
   * Actualiza datos, límites o vigencia de una promoción existente.
   */
  @Put('promotions/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.catalogAdminService.updatePromotion(id, dto);
  }

  /**
   * Modifica el estado activo/inactivo de una campaña promocional.
   */
  @Patch('promotions/:id/status')
  @FunctionRequired('Gestionar productos', 'Edición')
  togglePromotionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.catalogAdminService.togglePromotionStatus(id, dto.estado);
  }

  /**
   * Asigna o reemplaza masivamente los productos que participan en una promoción específica.
   */
  @Post('promotions/:id/products')
  @FunctionRequired('Gestionar productos', 'Edición')
  assignProductsToPromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPromotionProductsDto,
  ) {
    return this.catalogAdminService.assignProductsToPromotion(id, dto.product_ids);
  }
}
