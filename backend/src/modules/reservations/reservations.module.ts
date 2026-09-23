/**
 * @file reservations.module.ts
 * @description Módulo de Reservas de Prendas en Sucursales.
 * Agrupa los controladores y servicios correspondientes a los casos de uso:
 * - CU17: Realizar reserva temporal de prendas con bloqueo de stock.
 * - CU18: Consultar comprobante y cancelar reservas del cliente liberando inventario.
 * - CU19: Gestión operativa de reservas en mostrador de sucursal (preparación, atención, entrega y balance).
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../users-security/auth/auth.module.js';
import { UsersSecurityModule } from '../users-security/users-security.module.js';
import { ReservationsController } from './use-cases/CU17-realizar-reserva-prendas/reservations.controller.js';
import { ReservationsService } from './use-cases/CU17-realizar-reserva-prendas/reservations.service.js';

/**
 * Módulo para la orquestación integral de reservas omnicanal entre e-commerce y tiendas físicas.
 */
@Module({
  imports: [PrismaModule, AuthModule, UsersSecurityModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
