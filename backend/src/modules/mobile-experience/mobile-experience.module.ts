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
