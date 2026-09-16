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

@Controller('catalog/admin/suppliers')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get('metadata')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  getMetadata() {
    return this.suppliersService.getMetadata();
  }

  @Get()
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findAll(@Query() query: QuerySuppliersDto) {
    return this.suppliersService.findAllSuppliers(query);
  }

  @Get('purchase-orders/list')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findOrders(@Query() query: QueryPurchaseOrdersDto) {
    return this.suppliersService.findPurchaseOrders(query);
  }

  @Get('purchase-orders/:id')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findPurchaseOrderById(id);
  }

  @Post('purchase-orders')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  createOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.suppliersService.createPurchaseOrder(dto);
  }

  @Patch('purchase-orders/:id/status')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.suppliersService.updatePurchaseOrderStatus(id, dto.estado);
  }

  @Post('purchase-orders/:id/receive')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  receiveOrder(@Param('id', ParseIntPipe) id: number, @Body() dto: ReceivePurchaseOrderDto) {
    return this.suppliersService.receivePurchaseOrder(id, dto);
  }

  @Get(':id')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findSupplierById(id);
  }

  @Post()
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(dto);
  }

  @Put(':id')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.updateSupplier(id, dto);
  }

  @Delete(':id')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.deleteSupplier(id);
  }

  @Get(':id/products')
  @FunctionRequired('Gestionar proveedores', 'Lectura')
  findProducts(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findSupplierProducts(id);
  }

  @Post(':id/products')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  addProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSupplierProductDto,
  ) {
    return this.suppliersService.addSupplierProduct(id, dto);
  }

  @Put(':supplierId/products/:productId')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  updateProduct(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateSupplierProductDto,
  ) {
    return this.suppliersService.updateSupplierProduct(supplierId, productId, dto);
  }

  @Delete(':supplierId/products/:productId')
  @FunctionRequired('Gestionar proveedores', 'Edicion')
  removeProduct(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.suppliersService.removeSupplierProduct(supplierId, productId);
  }
}
