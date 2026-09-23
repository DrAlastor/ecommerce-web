/**
 * @modulo SalesBillingModule
 * @subsistema Ventas y Facturación
 * @capa Módulo de infraestructura y orquestación NestJS
 * @descripcion Agrupa y exporta los controladores y servicios que gestionan el ciclo completo de ventas:
 *              - CU20: Gestión de Carrito de Compras (digital/online)
 *              - CU21: Realización de Compra Digital (checkout, pasarela y envío)
 *              - CU22: Historial de Compras y Seguimiento de Pedidos
 *              - CU23: Procesamiento de Pagos y Facturación Electrónica (QR, tarjeta, efectivo)
 *              - CU24: Registro de Ventas Presenciales (Punto de Venta / POS en sucursal)
 *              - CU26: Gestión de Devoluciones y Garantías de Productos
 */
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
import { ReturnsController } from './use-cases/CU26-gestionar-devoluciones/returns.controller.js';
import { ReturnsService } from './use-cases/CU26-gestionar-devoluciones/returns.service.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersSecurityModule],
  controllers: [
    CartController,
    DigitalPurchaseController,
    PurchasesHistoryController,
    PaymentBillingController,
    PresentialSaleController,
    ReturnsController,
  ],
  providers: [
    CartService,
    DigitalPurchaseService,
    PurchasesHistoryService,
    PaymentBillingService,
    PresentialSaleService,
    ReturnsService,
  ],
  exports: [
    CartService,
    DigitalPurchaseService,
    PurchasesHistoryService,
    PaymentBillingService,
    PresentialSaleService,
    ReturnsService,
  ],
})
export class SalesBillingModule {}
