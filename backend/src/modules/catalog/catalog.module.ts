import { Module } from '@nestjs/common';
import { AuthModule } from '../users-security/auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { CatalogController } from './use-cases/CU08-consultar-catalogo-productos/catalog.controller.js';
import { CatalogService } from './use-cases/CU08-consultar-catalogo-productos/catalog.service.js';
import { ProductDetailController } from './use-cases/CU09-consultar-detalle-disponibilidad/product-detail.controller.js';
import { ProductDetailService } from './use-cases/CU09-consultar-detalle-disponibilidad/product-detail.service.js';
import { CatalogAdminController } from './use-cases/CU10-gestionar-catalogo-productos/catalog-admin.controller.js';
import { CatalogAdminService } from './use-cases/CU10-gestionar-catalogo-productos/catalog-admin.service.js';
import { SuppliersController } from './use-cases/CU11-gestionar-proveedores/suppliers.controller.js';
import { SuppliersService } from './use-cases/CU11-gestionar-proveedores/suppliers.service.js';
import { RecommendationsController } from './use-cases/CU12-obtener-recomendaciones-ia/recommendations.controller.js';
import { RecommendationsService } from './use-cases/CU12-obtener-recomendaciones-ia/recommendations.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CatalogController, ProductDetailController, CatalogAdminController, SuppliersController, RecommendationsController],
  providers: [CatalogService, ProductDetailService, CatalogAdminService, SuppliersService, RecommendationsService],
  exports: [CatalogService, ProductDetailService, CatalogAdminService, SuppliersService, RecommendationsService],
})
export class CatalogModule {}

