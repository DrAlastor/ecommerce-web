import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { PaymentBillingService } from './payment-billing.service.js';
import { ProcessPaymentDto } from './dto/process-payment.dto.js';

@Controller('sales-billing/payments')
@UseGuards(JwtAuthGuard)
export class PaymentBillingController {
  constructor(private readonly paymentService: PaymentBillingService) {}

  /**
   * Procesa el cobro de una venta y emite la factura fiscal
   * POST /api/sales-billing/payments/process
   */
  @Post('process')
  async processPayment(
    @Req() req: any,
    @Body() dto: ProcessPaymentDto,
    @Ip() ip: string,
  ) {
    return this.paymentService.processPayment(req.user, dto, ip);
  }

  /**
   * Obtiene la lista de ventas pendientes de cobro
   * GET /api/sales-billing/payments/pending
   */
  @Get('pending')
  async getPendingSales(@Req() req: any) {
    return this.paymentService.getPendingSales(req.user);
  }

  /**
   * Obtiene la factura fiscal emitida de una venta
   * GET /api/sales-billing/payments/invoice/:id
   */
  @Get('invoice/:id')
  async getInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getInvoice(id);
  }
}
