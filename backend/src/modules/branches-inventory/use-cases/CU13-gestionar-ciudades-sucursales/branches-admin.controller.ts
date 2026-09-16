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
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { BranchesService } from './branches.service.js';
import { CitiesService } from './cities.service.js';
import {
  CreateBranchDto,
  QueryBranchesDto,
  UpdateBranchDto,
  UpdateBranchStatusDto,
} from './dto/branches.dto.js';
import {
  CreateCityDto,
  QueryCitiesDto,
  UpdateCityDto,
} from './dto/cities.dto.js';

@Controller('branches-inventory/admin')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class BranchesAdminController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly citiesService: CitiesService,
  ) {}

  // ==========================================
  // CIUDADES
  // ==========================================

  @Get('cities/simple')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findCitiesSimple() {
    return this.citiesService.findAllSimple();
  }

  @Get('cities')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findAllCities(@Query() query: QueryCitiesDto) {
    return this.citiesService.findAll(query);
  }

  @Get('cities/:id')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findCityById(@Param('id', ParseIntPipe) id: number) {
    return this.citiesService.findById(id);
  }

  @Post('cities')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  createCity(@Body() dto: CreateCityDto, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.citiesService.create(dto, idUsuario, ip);
  }

  @Put('cities/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  updateCity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
    @Req() req: any,
  ) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.citiesService.update(id, dto, idUsuario, ip);
  }

  @Delete('cities/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  deleteCity(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.citiesService.delete(id, idUsuario, ip);
  }

  // ==========================================
  // SUCURSALES
  // ==========================================

  @Get('branches/metadata')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  getBranchesMetadata() {
    return this.branchesService.getMetadata();
  }

  @Get('branches')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findAllBranches(@Query() query: QueryBranchesDto) {
    return this.branchesService.findAll(query);
  }

  @Get('branches/:id')
  @FunctionRequired('Gestionar sucursales', 'Lectura')
  findBranchById(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findById(id);
  }

  @Post('branches')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  createBranch(@Body() dto: CreateBranchDto, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.create(dto, idUsuario, ip);
  }

  @Put('branches/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  updateBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
    @Req() req: any,
  ) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.update(id, dto, idUsuario, ip);
  }

  @Patch('branches/:id/status')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  updateBranchStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchStatusDto,
    @Req() req: any,
  ) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.updateStatus(id, dto.estado, idUsuario, ip);
  }

  @Delete('branches/:id')
  @FunctionRequired('Gestionar sucursales', 'Edicion')
  deleteBranch(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const idUsuario = req.user?.id_usuario;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.branchesService.delete(id, idUsuario, ip);
  }
}
