import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { EmpleadosService } from './empleados.service.js';
import {
  QueryEmployeesDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from './dto/empleados.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';

@Controller('users-security/employees')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Get()
  @FunctionRequired('Gestionar empleados', 'Lectura')
  findAll(@Query() query: QueryEmployeesDto) {
    return this.empleadosService.findAll(query);
  }

  @Get('branches')
  @FunctionRequired('Gestionar empleados', 'Lectura')
  getBranches() {
    return this.empleadosService.getBranches();
  }

  @Get('roles')
  @FunctionRequired('Gestionar empleados', 'Lectura')
  getEmployeeRoles() {
    return this.empleadosService.getEmployeeRoles();
  }

  @Get(':id')
  @FunctionRequired('Gestionar empleados', 'Lectura')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empleadosService.findOne(id);
  }

  @Post()
  @FunctionRequired('Gestionar empleados', 'Edición')
  create(
    @Body() dto: CreateEmployeeDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.empleadosService.create(dto, req.user.id_usuario, ip);
  }

  @Put(':id')
  @FunctionRequired('Gestionar empleados', 'Edición')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.empleadosService.update(id, dto, req.user.id_usuario, ip);
  }

  @Patch(':id/status')
  @FunctionRequired('Gestionar empleados', 'Edición')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.empleadosService.updateStatus(id, dto, req.user.id_usuario, ip);
  }
}
