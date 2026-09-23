/**
 * @file suppliers.controller.ts
 * @caso-de-uso CU11 — Gestionar proveedores y compras de reabastecimiento
 * @subsistema Catálogo y Proveedores
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints protegidos por RBAC para la administración de:
 * - Proveedores comerciales y catálogo de productos suministrados con precios pactados.
 * - Órdenes de compra mercantil y control de estado (borrador, enviada, confirmada, cancelada).
 * - Recepción e ingreso físico de mercadería a inventario de sucursal con actualización de stock.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import {
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  CreateSupplierProductDto,
  QueryPurchaseOrdersDto,
  QuerySuppliersDto,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
  UpdateSupplierDto,
  UpdateSupplierProductDto,
} from './dto/suppliers.dto.js';
import { SuppliersService } from './suppliers.service.js';

/**
 * Controlador de gestión de proveedores, catálogo de abastecimiento y órdenes de compra.
 */
@Controller('catalog/admin/suppliers')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Obtiene metadatos de apoyo (sucursales físicas activas y variantes de productos)
   * para formular órdenes de compra y asociar ítems a proveedores.
   */
  @Get('metadata')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  getMetadata() {
    return this.suppliersService.getMetadata();
  }

  /**
   * Lista proveedores registrados con filtros por búsqueda de texto (nombre, contacto, email),
   * estado operativo y paginación.
   */
  @Get()
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findAll(@Query() query: QuerySuppliersDto) {
    return this.suppliersService.findAllSuppliers(query);
  }

  /**
   * Consulta las órdenes de compra emitidas con filtros por proveedor, estado, sucursal destino y rango de fechas.
   */
  @Get('purchase-orders/list')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findOrders(@Query() query: QueryPurchaseOrdersDto) {
    return this.suppliersService.findPurchaseOrders(query);
  }

  /**
   * Obtiene el detalle exhaustivo de una orden de compra, incluyendo ítems, variantes, cantidades y precios.
   */
  @Get('purchase-orders/:id')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findPurchaseOrderById(id);
  }

  /**
   * Registra y emite una nueva orden de compra para un proveedor y sucursal destino.
   */
  @Post('purchase-orders')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  createOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.suppliersService.createPurchaseOrder(dto);
  }

  /**
   * Cambia el estado de una orden de compra (ej. 'borrador' -> 'enviada', 'cancelada').
   */
  @Patch('purchase-orders/:id/status')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.suppliersService.updatePurchaseOrderStatus(id, dto.estado);
  }

  /**
   * Procesa la recepción física de mercadería de una orden de compra,
   * incrementando automáticamente el stock en inventario_sucursal y registrando movimientos de entrada.
   */
  @Post('purchase-orders/:id/receive')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  receiveOrder(@Param('id', ParseIntPipe) id: number, @Body() dto: ReceivePurchaseOrderDto) {
    return this.suppliersService.receivePurchaseOrder(id, dto);
  }

  /**
   * Consulta la ficha detallada de un proveedor por ID.
   */
  @Get(':id')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findSupplierById(id);
  }

  /**
   * Registra un nuevo proveedor en la plataforma mercantil.
   */
  @Post()
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(dto);
  }

  /**
   * Actualiza datos de contacto o estado de un proveedor existente.
   */
  @Put(':id')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.updateSupplier(id, dto);
  }

  /**
   * Elimina un proveedor si no posee órdenes de compra ni productos dependientes.
   */
  @Delete(':id')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.deleteSupplier(id);
  }

  /**
   * Lista los productos vinculados a un proveedor específico junto con el costo acordado.
   */
  @Get(':id/products')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findProducts(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findSupplierProducts(id);
  }

  /**
   * Vincula un producto del catálogo general a la lista de suministro de este proveedor.
   */
  @Post(':id/products')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  addProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSupplierProductDto,
  ) {
    return this.suppliersService.addSupplierProduct(id, dto);
  }

  /**
   * Actualiza el costo de adquisición o estado del producto en el catálogo de dicho proveedor.
   */
  @Put(':supplierId/products/:productId')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  updateProduct(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateSupplierProductDto,
  ) {
    return this.suppliersService.updateSupplierProduct(supplierId, productId, dto);
  }

  /**
   * Desvincula un producto de la cartera de abastecimiento del proveedor.
   */
  @Delete(':supplierId/products/:productId')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  removeProduct(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.suppliersService.removeSupplierProduct(supplierId, productId);
  }
}
