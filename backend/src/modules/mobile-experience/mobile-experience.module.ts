/**
 * @modulo MobileExperienceModule
 * @subsistema Experiencia Móvil e Interactiva
 * @capa Módulo de infraestructura y orquestación NestJS
 * @descripcion Módulo que gestiona las experiencias inmersivas y móviles de los clientes:
 *              - CU25: Utilizar Vestidor Virtual (probador con modelos 2D/3D y avatar del usuario)
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../users-security/auth/auth.module.js';
import { VirtualFittingController } from './use-cases/CU25-utilizar-vestidor-virtual/virtual-fitting.controller.js';
import { VirtualFittingService } from './use-cases/CU25-utilizar-vestidor-virtual/virtual-fitting.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VirtualFittingController],
  providers: [VirtualFittingService],
  exports: [VirtualFittingService],
})
export class MobileExperienceModule {}
