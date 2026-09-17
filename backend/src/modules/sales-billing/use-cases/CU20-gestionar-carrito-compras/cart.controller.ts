import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { AddToCartDto, SyncCartDto, UpdateCartItemDto } from '../../cart/dto/cart.dto.js';
import { CartService } from './cart.service.js';

@Controller('sales-billing/cart')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * CU20: Consulta el carrito activo del cliente con validación en tiempo real de precios y disponibilidad
   */
  @Get()
  @FunctionRequired('Gestionar Carrito de Compras', 'Lectura')
  async getMyCart(@Req() req: any) {
    return this.cartService.getCart(req.user);
  }

  /**
   * CU20: Agrega un producto variante al carrito
   */
  @Post('items')
  @FunctionRequired('Gestionar Carrito de Compras', 'Edicion')
  async addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.cartService.addToCart(req.user, dto, ip);
  }

  /**
   * CU20: Modifica la cantidad de un producto variante en el carrito
   */
  @Patch('items/:id')
  @FunctionRequired('Gestionar Carrito de Compras', 'Edicion')
  async updateItemQuantity(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(req.user, id, dto);
  }

  /**
   * CU20: Elimina un producto variante del carrito
   */
  @Delete('items/:id')
  @FunctionRequired('Gestionar Carrito de Compras', 'Edicion')
  async removeItem(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cartService.removeItem(req.user, id);
  }

  /**
   * CU20: Vacía todos los artículos del carrito
   */
  @Delete('clear')
  @FunctionRequired('Gestionar Carrito de Compras', 'Edicion')
  async clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user);
  }

  /**
   * CU20: Sincroniza ítems locales/invitado al carrito persistido tras iniciar sesión
   */
  @Post('sync')
  @FunctionRequired('Gestionar Carrito de Compras', 'Edicion')
  async syncGuestCart(@Req() req: any, @Body() dto: SyncCartDto) {
    return this.cartService.syncGuestCart(req.user, dto);
  }
}
