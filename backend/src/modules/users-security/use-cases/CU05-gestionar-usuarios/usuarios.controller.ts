import { Controller, Get, Param, ParseIntPipe, Patch, Put, Body, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { QueryUsersDto, UpdateUserStatusDto, UpdateUserAdminDto } from './dto/usuarios.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';

@Controller('users-security/users')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @FunctionRequired('Gestionar usuarios', 'Lectura')
  findAll(@Query() query: QueryUsersDto, @Req() req: any, @Ip() ip: string) {
    if (req.user?.id_usuario) {
      this.usuariosService.logConsultaUsers(req.user.id_usuario, ip);
    }
    return this.usuariosService.findAll(query);
  }

  @Get(':id')
  @FunctionRequired('Gestionar usuarios', 'Lectura')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Ip() ip: string) {
    if (req.user?.id_usuario) {
      this.usuariosService.logConsultaUserDetail(id, req.user.id_usuario, ip);
    }
    return this.usuariosService.findOne(id);
  }

  @Patch(':id/status')
  @FunctionRequired('Gestionar usuarios', 'Edición')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.usuariosService.updateStatus(id, dto, req.user.id_usuario, ip);
  }

  @Put(':id')
  @FunctionRequired('Gestionar usuarios', 'Edición')
  updateAdminData(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.usuariosService.updateAdminData(id, dto, req.user.id_usuario, ip);
  }
}
