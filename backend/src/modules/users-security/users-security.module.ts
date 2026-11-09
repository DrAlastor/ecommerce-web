import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosController } from './use-cases/CU04-gestionar-usuarios/usuarios.controller.js';
import { UsuariosService } from './use-cases/CU04-gestionar-usuarios/usuarios.service.js';
import { BitacoraService } from './shared/services/bitacora.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

import { BitacoraController } from './use-cases/CU10-consultar-bitacora/bitacora.controller.js';
import { RolesController } from './use-cases/CU05-gestionar-roles-permisos/roles.controller.js';
import { RolesService } from './use-cases/CU05-gestionar-roles-permisos/roles.service.js';
import { EmpleadosController } from './use-cases/CU06-gestionar-empleados/empleados.controller.js';
import { EmpleadosService } from './use-cases/CU06-gestionar-empleados/empleados.service.js';
import { CompanyController } from './use-cases/CU07-gestionar-empresas/company.controller.js';
import { CompanyService } from './use-cases/CU07-gestionar-empresas/company.service.js';
import { AppearanceController } from './use-cases/CU08-personalizar-apariencia/appearance.controller.js';
import { AppearanceService } from './use-cases/CU08-personalizar-apariencia/appearance.service.js';
import { BackupController } from './use-cases/CU09-gestionar-backups-restore/backup.controller.js';
import { BackupService } from './use-cases/CU09-gestionar-backups-restore/backup.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    UsuariosController,
    BitacoraController,
    RolesController,
    EmpleadosController,
    CompanyController,
    AppearanceController,
    BackupController,
  ],
  providers: [
    UsuariosService,
    BitacoraService,
    RolesService,
    EmpleadosService,
    CompanyService,
    AppearanceService,
    BackupService,
  ],
  exports: [
    AuthModule,
    BitacoraService,
    RolesService,
    EmpleadosService,
    CompanyService,
    AppearanceService,
    BackupService,
  ],
})
export class UsersSecurityModule {}
