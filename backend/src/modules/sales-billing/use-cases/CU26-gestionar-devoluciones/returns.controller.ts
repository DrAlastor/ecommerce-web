/**
 * @caso-de-uso CU26 — Gestionar Devoluciones
 * @subsistema Ventas y Facturación
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 */
import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { ReturnsService } from './returns.service.js';
import {
  CreateReturnDto,
  QueryReturnsDto,
  UpdateReturnStatusDto,
} from './dto/returns.dto.js';

@Controller('sales-billing/returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /**
   * Crea una solicitud de devolución (cliente) o procesa una devolución en tienda (personal).
   * POST /api/sales-billing/returns
   */
  @Post()
  async createReturn(@Req() req: any, @Body() dto: CreateReturnDto, @Ip() ip: string) {
    return this.returnsService.createReturn(req.user, dto, ip);
  }

  /**
   * Obtiene las solicitudes de devolución del cliente autenticado.
   * GET /api/sales-billing/returns/my-returns
   */
  @Get('my-returns')
  async getMyReturns(@Req() req: any) {
    return this.returnsService.getMyReturns(req.user);
  }

  /**
   * Obtiene la lista de todas las devoluciones (Staff/Admin).
   * GET /api/sales-billing/returns
   */
  @Get()
  async getAllReturns(@Query() query: QueryReturnsDto) {
    return this.returnsService.getAllReturns(query);
  }

  /**
   * Busca ventas por factura o comprobante para registrar una devolución en tienda.
   * GET /api/sales-billing/returns/lookup-sale/:term
   */
  @Get('lookup-sale/:term')
  async lookupSale(@Param('term') term: string) {
    return this.returnsService.lookupSaleForReturn(term);
  }

  /**
   * Obtiene el detalle de una devolución por su ID.
   * GET /api/sales-billing/returns/:id
   */
  @Get(':id')
  async getReturnById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.returnsService.getReturnById(id, req.user);
  }

  /**
   * Actualiza el estado de una devolución (Aprobar / Rechazar).
   * PATCH /api/sales-billing/returns/:id/status
   */
  @Patch(':id/status')
  async updateReturnStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReturnStatusDto,
    @Ip() ip: string,
  ) {
    return this.returnsService.updateReturnStatus(id, dto, req.user, ip);
  }
}
