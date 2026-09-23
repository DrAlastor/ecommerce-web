/**
 * @caso-de-uso CU24 — Registrar venta presencial
 * @subsistema Ventas, Pagos y Compras
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Cajero -> punto de venta -> controlador de ventas -> servicio transaccional -> Venta/DetalleVenta/Pago/Inventario.
 */
import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { PresentialSaleService } from './presential-sale.service.js';
import { CreatePresentialSaleDto } from './dto/create-presential-sale.dto.js';
import { QueryPOSProductsDto } from './dto/query-pos-products.dto.js';

@Controller('sales-billing/pos')
@UseGuards(JwtAuthGuard)
export class PresentialSaleController {
  constructor(private readonly posService: PresentialSaleService) {}

  /**
   * Obtiene las sucursales autorizadas para el cajero en turno
   * GET /api/sales-billing/pos/branches
   */
  @Get('branches')
  async getBranches(@Req() req: any) {
    return this.posService.getCashierBranches(req.user);
  }

  /**
   * Consulta productos con existencias locales en la sucursal seleccionada
   * GET /api/sales-billing/pos/products
   */
  @Get('products')
  async getProducts(@Query() query: QueryPOSProductsDto) {
    return this.posService.getPOSProducts(query);
  }

  /**
   * Búsqueda ágil de clientes por CI, NIT o nombre para el mostrador
   * GET /api/sales-billing/pos/clients?search=...
   */
  @Get('clients')
  async searchClients(@Query('search') search: string) {
    return this.posService.searchClients(search);
  }

  /**
   * Registra una venta presencial directa en mostrador con cobro y facturación
   * POST /api/sales-billing/pos/sales
   */
  @Post('sales')
  async registerSale(
    @Req() req: any,
    @Body() dto: CreatePresentialSaleDto,
    @Ip() ip: string,
  ) {
    return this.posService.registerPresentialSale(req.user, dto, ip);
  }

  /**
   * Consulta el historial de ventas presenciales y digitales
   * GET /api/sales-billing/pos/history
   */
  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('id_sucursal') id_sucursal?: string,
    @Query('search') search?: string,
    @Query('tipo_venta') tipo_venta?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posService.getSalesHistory(req.user, {
      id_sucursal: id_sucursal ? Number(id_sucursal) : undefined,
      search,
      tipo_venta,
      limit: limit ? Number(limit) : 50,
    });
  }
}

