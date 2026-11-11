import { Controller, Get, Put, Body, Param, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { AppearanceService } from './appearance.service.js';
import { UpdateAppearanceDto } from './dto/appearance.dto.js';
import { getTenantId } from '../../../../common/tenant/tenant-context.js';
import { CompanyService } from '../CU07-gestionar-empresas/company.service.js';

@Controller('users-security/appearance')
export class AppearanceController {
  constructor(private readonly appearanceService: AppearanceService, private readonly companyService: CompanyService) {}

  /**
   * Endpoint público para que la tienda (catálogo/home) obtenga el tema dinámico del tenant.
   */
  @Get('public/:tenant')
  async getPublicAppearance(@Param('tenant') tenant: string) {
    const key = tenant.toLowerCase().trim();
    const appearance = await this.appearanceService.getAppearance(key);
    const company = await this.companyService.getCompanyInfo(key);
    if (appearance.codigo_empresa !== key || company.codigo_empresa !== key) return appearance;
    const logo = company.logo_url;
    return {
      ...appearance,
      site_title: company.nombre_comercial,
      logo_url: appearance.logo_url || (/^(https:\/\/|data:image\/)/i.test(logo || '') ? logo : ''),
    };
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
    return this.appearanceService.getAppearance(getTenantId(), userId, ip);
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
    return this.appearanceService.updateAppearance({ ...dto, codigo_empresa: getTenantId() }, getTenantId(), userId, ip);
  }
}
