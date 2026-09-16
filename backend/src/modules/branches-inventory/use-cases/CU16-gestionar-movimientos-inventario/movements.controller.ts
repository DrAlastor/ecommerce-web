import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { CreateMovementDto, QueryMovementsDto } from './dto/movements.dto.js';
import { MovementsService } from './movements.service.js';

@Controller('branches-inventory/admin/movements')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get('metadata')
  @FunctionRequired('Gestionar movimientos de inventario', 'Lectura')
  async getMovementMetadata(@Req() req: any) {
    return this.movementsService.getMovementMetadata(req.user);
  }

  @Get(':id')
  @FunctionRequired('Gestionar movimientos de inventario', 'Lectura')
  async getMovementDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.movementsService.getMovementDetail(req.user, id);
  }

  @Get()
  @FunctionRequired('Gestionar movimientos de inventario', 'Lectura')
  async getMovements(
    @Req() req: any,
    @Query() query: QueryMovementsDto,
  ) {
    return this.movementsService.getMovements(req.user, query);
  }

  @Post()
  @FunctionRequired('Gestionar movimientos de inventario', 'Edicion')
  async createMovement(
    @Req() req: any,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.createMovement(req.user, dto);
  }
}
