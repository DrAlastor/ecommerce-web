import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendService } from '../services/resend.service.js';

@Module({
  imports: [ConfigModule],
  providers: [ResendService],
  exports: [ResendService],
})
export class ResendModule {}
