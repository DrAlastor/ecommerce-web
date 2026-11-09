/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Control (API REST) — Backend
 * @responsabilidad Recibe la solicitud HTTP, aplica guardas o validaciones y delega la lógica al servicio del caso de uso.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { VirtualFittingService } from './virtual-fitting.service.js';
import { RegisterFittingInteractionDto } from './dto/virtual-fitting.dto.js';

@Controller('virtual-fitting')
export class VirtualFittingController {
  constructor(private readonly virtualFittingService: VirtualFittingService) {}

  /**
   * Obtiene los datos de una variante específica para el vestidor virtual.
   * Incluye modelo 3D, precio, talla, color y datos del producto.
   */
  @Get('variant/:variantId')
  getVariantForFitting(@Param('variantId', ParseIntPipe) variantId: number) {
    return this.virtualFittingService.getVariantForFitting(variantId);
  }

  /**
   * Obtiene todas las variantes de un producto compatibles con RA.
   * Solo retorna variantes activas que dispongan de modelo_3d_url.
   */
  @Get('product/:productId/ar-variants')
  getArVariants(@Param('productId', ParseIntPipe) productId: number) {
    return this.virtualFittingService.getArVariantsByProduct(productId);
  }

  /**
   * Registra que un cliente utilizó el vestidor virtual con un producto.
   * Requiere autenticación JWT. No almacena imágenes (RN-M6-11).
   */
  @Post('interaction')
  @UseGuards(JwtAuthGuard)
  registerInteraction(
    @Req() request: any,
    @Body() dto: RegisterFittingInteractionDto,
  ) {
    return this.virtualFittingService.registerInteraction(
      request.user.id_usuario,
      dto.id_producto,
    );
  }
}
