import { Controller, Get, Query } from '@nestjs/common';
import { SaasBitacoraItem, SaasBitacoraService } from './saas-bitacora.service.js';

@Controller('saas/bitacora')
export class SaasBitacoraController {
  constructor(private readonly bitacoraService: SaasBitacoraService) {}

  @Get()
  async getBitacora(
    @Query('tenantKey') tenantKey?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
  ): Promise<SaasBitacoraItem[]> {
    return this.bitacoraService.getConsolidatedBitacora({
      tenantKey,
      search,
      limit: limit ? Number(limit) : 500,
    });
  }
}

