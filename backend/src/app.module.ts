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
      isGlobal: true,
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