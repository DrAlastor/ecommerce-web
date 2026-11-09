import { Controller, Get, Put, Body, Param, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { AppearanceService } from './appearance.service.js';
import { UpdateAppearanceDto } from './dto/appearance.dto.js';

@Controller('users-security/appearance')
export class AppearanceController {
  constructor(private readonly appearanceService: AppearanceService) {}

  /**
   * Endpoint público para que la tienda (catálogo/home) obtenga el tema dinámico del tenant.
   */
  @Get('public/:tenant')
  getPublicAppearance(@Param('tenant') tenant: string) {
    return this.appearanceService.getAppearance(tenant);
  }

  /**
   * Obtiene la lista de presets de diseño estilizados.
   */
  @Get('presets')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Personalizar apariencia', 'Lectura')
  getPresets() {
    return this.appearanceService.getPresets();
  }

  /**
   * Endpoint administrativo protegido para obtener el tema del tenant actual.
   */
  @Get()
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Personalizar apariencia', 'Lectura')
  getAppearance(@Query('tenant') tenant: string, @Req() req: any, @Ip() ip: string) {
    const userId = req.user?.id_usuario || 1;
    return this.appearanceService.getAppearance(tenant, userId, ip);
  }

  /**
   * Endpoint administrativo protegido para actualizar y publicar el tema visual del tenant.
   */
  @Put()
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Personalizar apariencia', 'Edicion')
  updateAppearance(
    @Body() dto: UpdateAppearanceDto,
    @Query('tenant') tenant: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const userId = req.user?.id_usuario || 1;
    return this.appearanceService.updateAppearance(dto, tenant, userId, ip);
  }
}
