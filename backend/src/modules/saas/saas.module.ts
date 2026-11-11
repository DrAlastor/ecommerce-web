import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersSecurityModule } from '../users-security/users-security.module.js';

import { SaasDashboardController } from './use-cases/CU04-gestionar-dashboard-superadmin/saas-dashboard.controller.js';
import { SaasDashboardService } from './use-cases/CU04-gestionar-dashboard-superadmin/saas-dashboard.service.js';

import { SaasMonitoringController } from './use-cases/CU05-gestionar-monitoreo-tenant/saas-monitoring.controller.js';
import { SaasMonitoringService } from './use-cases/CU05-gestionar-monitoreo-tenant/saas-monitoring.service.js';

import { SaasAuthController } from './use-cases/saas-auth/saas-auth.controller.js';
import { SaasAuthService } from './use-cases/saas-auth/saas-auth.service.js';

import { SaasTenantsController } from './use-cases/saas-tenants/saas-tenants.controller.js';
import { SaasTenantsService } from './use-cases/saas-tenants/saas-tenants.service.js';

import { SaasBitacoraController } from './use-cases/saas-bitacora/saas-bitacora.controller.js';
import { SaasBitacoraService } from './use-cases/saas-bitacora/saas-bitacora.service.js';

import { SaasBackupsController } from './use-cases/saas-backups/saas-backups.controller.js';
import { SaasBackupsService } from './use-cases/saas-backups/saas-backups.service.js';

import { SaasPlansController } from './use-cases/CU02-gestionar-planes-suscripcion/saas-plans.controller.js';
import { SaasPlansService } from './use-cases/CU02-gestionar-planes-suscripcion/saas-plans.service.js';
import { SaasSuperAdminGuard } from './guards/saas-superadmin.guard.js';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    UsersSecurityModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'fashionstore-super-secret-jwt-key'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
  ],
  controllers: [
    SaasDashboardController,
    SaasMonitoringController,
    SaasAuthController,
    SaasTenantsController,
    SaasBitacoraController,
    SaasBackupsController,
    SaasPlansController,
  ],
  providers: [
    SaasDashboardService,
    SaasMonitoringService,
    SaasAuthService,
    SaasTenantsService,
    SaasBitacoraService,
    SaasBackupsService,
    SaasPlansService,
    SaasSuperAdminGuard,
  ],
  exports: [
    SaasDashboardService,
    SaasMonitoringService,
    SaasAuthService,
    SaasTenantsService,
    SaasBitacoraService,
    SaasBackupsService,
    SaasPlansService,
    SaasSuperAdminGuard,
  ],
})
export class SaasModule {}
