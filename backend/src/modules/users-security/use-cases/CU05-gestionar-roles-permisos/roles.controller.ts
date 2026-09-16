import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { UpdateRolePermissionsDto } from './dto/roles.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';

@Controller('users-security/roles')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @FunctionRequired('Gestionar roles', 'Lectura')
  getRoles() {
    return this.rolesService.getRoles();
  }

  @Get('modules-tree')
  @FunctionRequired('Gestionar roles', 'Lectura')
  getModulesTree() {
    return this.rolesService.getModulesTree();
  }

  @Get(':id')
  @FunctionRequired('Gestionar roles', 'Lectura')
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Put(':id/permissions')
  @FunctionRequired('Gestionar roles', 'Edición')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolePermissionsDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.rolesService.updateRolePermissions(
      id,
      dto,
      req.user.id_usuario,
      ip,
    );
  }
}
