import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosController } from './use-cases/CU05-gestionar-usuarios/usuarios.controller.js';
import { UsuariosService } from './use-cases/CU05-gestionar-usuarios/usuarios.service.js';
import { BitacoraService } from './shared/services/bitacora.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

import { BitacoraController } from './use-cases/CU08-consultar-bitacora/bitacora.controller.js';
import { RolesController } from './use-cases/CU06-gestionar-roles-permisos/roles.controller.js';
import { RolesService } from './use-cases/CU06-gestionar-roles-permisos/roles.service.js';
import { EmpleadosController } from './use-cases/CU07-gestionar-empleados/empleados.controller.js';
import { EmpleadosService } from './use-cases/CU07-gestionar-empleados/empleados.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    UsuariosController,
    BitacoraController,
    RolesController,
    EmpleadosController,
  ],
  providers: [
    UsuariosService,
    BitacoraService,
    RolesService,
    EmpleadosService,
  ],
  exports: [AuthModule, BitacoraService, RolesService, EmpleadosService],
})
export class UsersSecurityModule {}
