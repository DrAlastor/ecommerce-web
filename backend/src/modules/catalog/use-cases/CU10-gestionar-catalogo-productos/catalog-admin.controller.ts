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

@Controller('catalog/admin')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  // ==========================================
  // METADATA
  // ==========================================
  @Get('metadata')
  @FunctionRequired('Gestionar productos', 'Lectura')
  getMetadata() {
    return this.catalogAdminService.getMetadata();
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  @Get('products')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllProducts(@Query() query: QueryAdminProductsDto) {
    return this.catalogAdminService.findAllProducts(query);
  }

  @Get('products/:id')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findProductById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.findProductById(id);
  }

  @Post('products')
  @FunctionRequired('Gestionar productos', 'Edición')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogAdminService.createProduct(dto);
  }

  @Put('products/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.catalogAdminService.updateProduct(id, dto);
  }

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
  @Get('products/:id/variants')
  @FunctionRequired('Gestionar variantes', 'Lectura')
  findVariantsByProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.findVariantsByProduct(id);
  }

  @Post('products/:id/variants')
  @FunctionRequired('Gestionar variantes', 'Edición')
  createVariant(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateVariantDto,
  ) {
    return this.catalogAdminService.createVariant(productId, dto);
  }

  @Put('variants/:id')
  @FunctionRequired('Gestionar variantes', 'Edición')
  updateVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.catalogAdminService.updateVariant(id, dto);
  }

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
  @Post('products/:id/images')
  @FunctionRequired('Gestionar productos', 'Edición')
  addProductImage(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.catalogAdminService.addProductImage(productId, dto);
  }

  @Delete('images/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteProductImage(@Param('id', ParseIntPipe) imageId: number) {
    return this.catalogAdminService.deleteProductImage(imageId);
  }

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
  @Get('categories')
  @FunctionRequired('Gestionar categorias', 'Lectura')
  findAllCategories() {
    return this.catalogAdminService.findAllCategories();
  }

  @Post('categories')
  @FunctionRequired('Gestionar categorias', 'Edición')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogAdminService.createCategory(dto);
  }

  @Put('categories/:id')
  @FunctionRequired('Gestionar categorias', 'Edición')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogAdminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @FunctionRequired('Gestionar categorias', 'Edición')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteCategory(id);
  }

  // ==========================================
  // SIZES
  // ==========================================
  @Get('sizes')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllSizes() {
    return this.catalogAdminService.findAllSizes();
  }

  @Post('sizes')
  @FunctionRequired('Gestionar productos', 'Edición')
  createSize(@Body() dto: CreateSizeDto) {
    return this.catalogAdminService.createSize(dto);
  }

  @Delete('sizes/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteSize(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteSize(id);
  }

  // ==========================================
  // COLORS
  // ==========================================
  @Get('colors')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllColors() {
    return this.catalogAdminService.findAllColors();
  }

  @Post('colors')
  @FunctionRequired('Gestionar productos', 'Edición')
  createColor(@Body() dto: CreateColorDto) {
    return this.catalogAdminService.createColor(dto);
  }

  @Put('colors/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateColor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColorDto,
  ) {
    return this.catalogAdminService.updateColor(id, dto);
  }

  @Delete('colors/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteColor(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteColor(id);
  }

  // ==========================================
  // SEASONS
  // ==========================================
  @Get('seasons')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllSeasons() {
    return this.catalogAdminService.findAllSeasons();
  }

  @Post('seasons')
  @FunctionRequired('Gestionar productos', 'Edición')
  createSeason(@Body() dto: CreateSeasonDto) {
    return this.catalogAdminService.createSeason(dto);
  }

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
  @Get('collections')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllCollections() {
    return this.catalogAdminService.findAllCollections();
  }

  @Post('collections')
  @FunctionRequired('Gestionar productos', 'Edición')
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.catalogAdminService.createCollection(dto);
  }

  @Put('collections/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateCollection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.catalogAdminService.updateCollection(id, dto);
  }

  @Delete('collections/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteCollection(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteCollection(id);
  }

  // ==========================================
  // SIZE GUIDES
  // ==========================================
  @Get('size-guides')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllSizeGuides(@Query('id_categoria') id_categoria?: string) {
    const catId = id_categoria ? parseInt(id_categoria, 10) : undefined;
    return this.catalogAdminService.findAllSizeGuides(catId);
  }

  @Post('size-guides')
  @FunctionRequired('Gestionar productos', 'Edición')
  createSizeGuide(@Body() dto: CreateSizeGuideDto) {
    return this.catalogAdminService.createSizeGuide(dto);
  }

  @Put('size-guides/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updateSizeGuide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSizeGuideDto,
  ) {
    return this.catalogAdminService.updateSizeGuide(id, dto);
  }

  @Delete('size-guides/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  deleteSizeGuide(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteSizeGuide(id);
  }

  // ==========================================
  // PROMOTIONS
  // ==========================================
  @Get('promotions')
  @FunctionRequired('Gestionar productos', 'Lectura')
  findAllPromotions() {
    return this.catalogAdminService.findAllPromotions();
  }

  @Post('promotions')
  @FunctionRequired('Gestionar productos', 'Edición')
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.catalogAdminService.createPromotion(dto);
  }

  @Put('promotions/:id')
  @FunctionRequired('Gestionar productos', 'Edición')
  updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.catalogAdminService.updatePromotion(id, dto);
  }

  @Patch('promotions/:id/status')
  @FunctionRequired('Gestionar productos', 'Edición')
  togglePromotionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.catalogAdminService.togglePromotionStatus(id, dto.estado);
  }

  @Post('promotions/:id/products')
  @FunctionRequired('Gestionar productos', 'Edición')
  assignProductsToPromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPromotionProductsDto,
  ) {
    return this.catalogAdminService.assignProductsToPromotion(id, dto.product_ids);
  }
}
