/**
 * @file app.module.ts
 * @description Módulo raíz (Root Module) de la arquitectura NestJS.
 * Orquesta la inyección de dependencias de todos los submódulos de dominio del sistema:
 * - ConfigModule: Carga de variables de entorno globales (.env).
 * - PrismaModule: Conectividad y persistencia con base de datos PostgreSQL.
 * - UsersSecurityModule: Autenticación, usuarios, roles, empleados, bitácora y permisos.
 * - CatalogModule: Catálogo público, fichas técnicas, gestión administrativa de prendas y proveedores.
 * - BranchesInventoryModule: Ciudades, sucursales físicas, existencias e inventario en tiempo real.
 * - ReservationsModule: Reservas de prendas en boutiques para prueba o apartado.
 * - SalesBillingModule: Carrito, compras online, pagos/facturación, POS presencial y devoluciones.
 * - MobileExperienceModule: Vestidor virtual 2D y 3D para la app móvil.
 * - ReportsDashboardModule: Dashboard gerencial, KPIs analíticos y exportadores PDF/Excel.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersSecurityModule } from './modules/users-security/users-security.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { BranchesInventoryModule } from './modules/branches-inventory/branches-inventory.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { SalesBillingModule } from './modules/sales-billing/sales-billing.module.js';
import { MobileExperienceModule } from './modules/mobile-experience/mobile-experience.module.js';
import { ReportsDashboardModule } from './modules/reports-dashboard/reports-dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Disponible en todo el árbol de inyección sin necesidad de reimportar
    }),
    PrismaModule,
    UsersSecurityModule,
    CatalogModule,
    BranchesInventoryModule,
    ReservationsModule,
    SalesBillingModule,
    MobileExperienceModule,
    ReportsDashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }