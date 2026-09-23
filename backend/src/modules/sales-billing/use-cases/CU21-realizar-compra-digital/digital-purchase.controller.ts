/**
 * @caso-de-uso CU21 — Realizar compra digital
 * @subsistema Ventas, Pagos y Compras
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Cliente -> checkout -> controlador de compra -> servicios de compra y pago -> Venta/DetalleVenta/Pago/Inventario.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { ProcessDigitalPurchaseDto } from './dto/checkout.dto.js';
import { DigitalPurchaseService } from './digital-purchase.service.js';

@Controller('sales-billing/checkout')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class DigitalPurchaseController {
  constructor(private readonly digitalPurchaseService: DigitalPurchaseService) {}

  /**
   * CU21: Inicializa la pasarela de pago (Stripe PaymentIntent o simulación) para el carrito activo
   */
  @Post('payment-intent')
  @FunctionRequired('Realizar Compra Digital', 'Edicion')
  async createPaymentIntent(@Req() req: any) {
    return this.digitalPurchaseService.createStripePaymentIntent(req.user);
  }

  /**
   * CU21: Procesa la compra digital de forma atómica: venta + pago + salida de inventario + factura
   */
  @Post('process')
  @FunctionRequired('Realizar Compra Digital', 'Edicion')
  async processPurchase(@Req() req: any, @Body() dto: ProcessDigitalPurchaseDto) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.digitalPurchaseService.processPurchase(req.user, dto, ip);
  }

  /**
   * CU21: Obtiene el comprobante / factura detallada de la compra
   */
  @Get('receipt/:id')
  @FunctionRequired('Realizar Compra Digital', 'Lectura')
  async getReceipt(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.digitalPurchaseService.getOrderReceipt(req.user, id);
  }
}
