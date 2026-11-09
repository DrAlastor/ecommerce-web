import { Controller, Get, Put, Body, Param, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { CompanyService } from './company.service.js';
import { UpdateCompanyDto } from './dto/company.dto.js';

@Controller('users-security/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Endpoint público para que la vitrina de la tienda obtenga los datos corporativos del tenant.
   */
  @Get('public/:tenant')
  getPublicCompany(@Param('tenant') tenant: string) {
    return this.companyService.getCompanyInfo(tenant);
  }

  /**
   * Endpoint administrativo protegido para listar todas las empresas registradas.
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar empresas', 'Lectura')
  listAllCompanies() {
    return this.companyService.listAllCompanies();
  }

  /**
   * Endpoint administrativo protegido para obtener los datos de la empresa actual del tenant.
   */
  @Get()
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar empresas', 'Lectura')
  getCompany(@Query('tenant') tenant: string, @Req() req: any, @Ip() ip: string) {
    const userId = req.user?.id_usuario || 1;
    return this.companyService.getCompanyInfo(tenant, userId, ip);
  }

  /**
   * Endpoint administrativo protegido para actualizar los datos corporativos del tenant.
   */
  @Put()
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar empresas', 'Edicion')
  updateCompany(
    @Body() dto: UpdateCompanyDto,
    @Query('tenant') tenant: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const userId = req.user?.id_usuario || 1;
    return this.companyService.updateCompany(dto, tenant, userId, ip);
  }
}
