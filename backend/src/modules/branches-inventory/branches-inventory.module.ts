/**
 * @file branches-inventory.module.ts
 * @description Módulo de Sucursales e Inventario.
 * Agrupa los controladores y servicios correspondientes a los casos de uso:
 * - CU13: Gestión administrativa de ciudades y sucursales físicas.
 * - CU14: Consulta pública de sucursales, horarios, ubicación y teléfonos.
 * - CU15: Consulta y auditoría de inventario por sucursal y stock global.
 * - CU16: Gestión de movimientos de inventario (entradas, salidas, ajustes y transferencias entre tiendas).
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../users-security/auth/auth.module.js';
import { UsersSecurityModule } from '../users-security/users-security.module.js';
import { BranchesAdminController } from './use-cases/CU13-gestionar-ciudades-sucursales/branches-admin.controller.js';
import { BranchesService } from './use-cases/CU13-gestionar-ciudades-sucursales/branches.service.js';
import { CitiesService } from './use-cases/CU13-gestionar-ciudades-sucursales/cities.service.js';
import { BranchesPublicController } from './use-cases/CU14-consultar-sucursales/branches-public.controller.js';
import { BranchesPublicService } from './use-cases/CU14-consultar-sucursales/branches-public.service.js';
import { InventoryController } from './use-cases/CU15-consultar-inventario/inventory.controller.js';
import { InventoryService } from './use-cases/CU15-consultar-inventario/inventory.service.js';
import { MovementsController } from './use-cases/CU16-gestionar-movimientos-inventario/movements.controller.js';
import { MovementsService } from './use-cases/CU16-gestionar-movimientos-inventario/movements.service.js';

/**
 * Módulo para la administración de la red física de sucursales, ciudades y el control de existencias en tiempo real.
 */
@Module({
  imports: [PrismaModule, AuthModule, UsersSecurityModule],
  controllers: [
    BranchesAdminController,
    BranchesPublicController,
    InventoryController,
    MovementsController,
  ],
  providers: [
    BranchesService,
    CitiesService,
    BranchesPublicService,
    InventoryService,
    MovementsService,
  ],
  exports: [
    BranchesService,
    CitiesService,
    BranchesPublicService,
    InventoryService,
    MovementsService,
  ],
})
export class BranchesInventoryModule {}
