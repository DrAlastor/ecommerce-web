import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { QueryInventoryDto } from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller('branches-inventory/admin/inventory')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Obtiene metadatos para filtros (sucursales autorizadas para el usuario, tallas, colores, etc.)
   */
  @Get('metadata')
  @FunctionRequired('Gestionar inventario', 'Lectura')
  async getMetadata(@Req() req: any) {
    return this.inventoryService.getMetadata(req.user);
  }

  /**
   * CU14 — Consultar existencias de inventario por producto/variante según sucursales permitidas
   */
  @Get()
  @FunctionRequired('Gestionar inventario', 'Lectura')
  async getInventory(@Req() req: any, @Query() query: QueryInventoryDto) {
    return this.inventoryService.getInventory(req.user, query);
  }

  /**
   * Obtiene el detalle de un registro específico de inventario
   */
  @Get(':id')
  @FunctionRequired('Gestionar inventario', 'Lectura')
  async getInventoryDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventoryService.getInventoryDetail(req.user, id);
  }
}
