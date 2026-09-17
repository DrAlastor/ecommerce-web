import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { PurchasesHistoryService } from './purchases-history.service.js';
import { PurchasesFilterDto } from './dto/purchases-filter.dto.js';

@Controller('sales-billing/purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesHistoryController {
  constructor(private readonly purchasesService: PurchasesHistoryService) {}

  /**
   * Obtiene la lista de compras del cliente autenticado
   * GET /api/sales-billing/purchases
   */
  @Get()
  async getPurchases(@Req() req: any, @Query() filter: PurchasesFilterDto) {
    return this.purchasesService.getPurchases(req.user, filter);
  }

  /**
   * Consulta el detalle y comprobante oficial de una compra
   * GET /api/sales-billing/purchases/:id
   */
  @Get(':id')
  async getPurchaseById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.getPurchaseById(req.user, id);
  }
}
