import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../users-security/auth/auth.module.js';
import { UsersSecurityModule } from '../users-security/users-security.module.js';
import { CartController } from './use-cases/CU20-gestionar-carrito-compras/cart.controller.js';
import { CartService } from './use-cases/CU20-gestionar-carrito-compras/cart.service.js';
import { DigitalPurchaseController } from './use-cases/CU21-realizar-compra-digital/digital-purchase.controller.js';
import { DigitalPurchaseService } from './use-cases/CU21-realizar-compra-digital/digital-purchase.service.js';
import { PurchasesHistoryController } from './use-cases/CU22-consultar-historial-compras/purchases-history.controller.js';
import { PurchasesHistoryService } from './use-cases/CU22-consultar-historial-compras/purchases-history.service.js';
import { PaymentBillingController } from './use-cases/CU23-procesar-pagos-facturacion/payment-billing.controller.js';
import { PaymentBillingService } from './use-cases/CU23-procesar-pagos-facturacion/payment-billing.service.js';
import { PresentialSaleController } from './use-cases/CU24-registrar-venta-presencial/presential-sale.controller.js';
import { PresentialSaleService } from './use-cases/CU24-registrar-venta-presencial/presential-sale.service.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersSecurityModule],
  controllers: [
    CartController,
    DigitalPurchaseController,
    PurchasesHistoryController,
    PaymentBillingController,
    PresentialSaleController,
  ],
  providers: [
    CartService,
    DigitalPurchaseService,
    PurchasesHistoryService,
    PaymentBillingService,
    PresentialSaleService,
  ],
  exports: [
    CartService,
    DigitalPurchaseService,
    PurchasesHistoryService,
    PaymentBillingService,
    PresentialSaleService,
  ],
})
export class SalesBillingModule {}

