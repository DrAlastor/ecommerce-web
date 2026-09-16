import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BranchesPublicService } from './branches-public.service.js';

@Controller('branches-inventory/public')
export class BranchesPublicController {
  constructor(private readonly branchesPublicService: BranchesPublicService) {}

  /**
   * CU09 — Consultar sucursales activas disponibles para clientes
   * Permite filtrado opcional por id_ciudad y término de búsqueda
   */
  @Get('branches')
  async getActiveBranches(
    @Query('id_ciudad') id_ciudad?: string,
    @Query('search') search?: string,
  ) {
    const cityId = id_ciudad ? parseInt(id_ciudad, 10) : undefined;
    return this.branchesPublicService.getActiveBranches({
      id_ciudad: isNaN(cityId as number) ? undefined : cityId,
      search,
    });
  }

  /**
   * Obtiene la información pública detallada de una sucursal específica
   */
  @Get('branches/:id')
  async getActiveBranchById(@Param('id', ParseIntPipe) id: number) {
    return this.branchesPublicService.getActiveBranchById(id);
  }

  /**
   * Obtiene las ciudades que tienen sucursales activas registradas
   */
  @Get('cities')
  async getActiveCities() {
    return this.branchesPublicService.getActiveCities();
  }
}
