import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionRequired } from '../../../users-security/shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../../users-security/shared/guards/function.guard.js';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { CreateReservationDto } from './dto/reservations.dto.js';
import {
  CancelReservationDto,
  QueryMyReservationsDto,
} from '../CU18-consultar-cancelar-reserva/dto/cancel-reservation.dto.js';
import {
  QueryBranchReservationsDto,
  UpdateBranchReservationStatusDto,
} from '../CU19-gestionar-reserva-sucursal/dto/branch-reservations.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * CU19: Consulta las sucursales asignadas al personal autenticado
   */
  @Get('branch/my-branches')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar Reserva en Sucursal', 'Lectura')
  async getBranchStaffBranches(@Req() req: any) {
    return this.reservationsService.getBranchStaffBranches(req.user);
  }

  /**
   * CU19: Lista las reservas operativas de la sucursal para el personal
   */
  @Get('branch/list')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar Reserva en Sucursal', 'Lectura')
  async getBranchReservations(
    @Req() req: any,
    @Query() query: QueryBranchReservationsDto,
  ) {
    return this.reservationsService.getBranchReservations(req.user, query);
  }

  /**
   * CU19: Actualiza el estado de una reserva en sucursal (Preparada, Atendida, Completada, Cancelada)
   */
  @Patch('branch/:id/status')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar Reserva en Sucursal', 'Edicion')
  async updateBranchReservationStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchReservationStatusDto,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.reservationsService.updateBranchReservationStatus(req.user, id, dto, ip);
  }

  /**
   * Consulta las sucursales activas y existencias disponibles para una variante
   */
  @Get('branch-availability/:variantId')
  async getBranchAvailability(
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.reservationsService.getBranchAvailability(variantId);
  }

  @Get('availability/:variantId')
  async getBranchAvailabilityAlias(
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.reservationsService.getBranchAvailability(variantId);
  }

  /**
   * CU18: Consulta las reservas realizadas por el cliente autenticado
   */
  @Get('my-reservations')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Consultar y Cancelar Reserva', 'Lectura')
  async getMyReservations(
    @Req() req: any,
    @Query() query: QueryMyReservationsDto,
  ) {
    return this.reservationsService.getMyReservations(req.user, query);
  }

  /**
   * Registra una nueva reserva temporal de prendas (CU17)
   */
  @Post()
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Realizar Reserva de Prendas', 'Edicion')
  async createReservation(
    @Req() req: any,
    @Body() dto: CreateReservationDto,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.reservationsService.createReservation(req.user, dto, ip);
  }

  /**
   * CU18: Cancela una reserva activa del cliente y libera inventario
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Consultar y Cancelar Reserva', 'Lectura')
  async cancelMyReservation(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelReservationDto,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.reservationsService.cancelMyReservation(req.user, id, dto.motivo, ip);
  }

  /**
   * Consulta el comprobante de una reserva por su código único
   */
  @Get('code/:code')
  @UseGuards(JwtAuthGuard)
  async getReservationByCode(
    @Req() req: any,
    @Param('code') code: string,
  ) {
    return this.reservationsService.getReservationByCode(req.user, code);
  }

  /**
   * Consulta el comprobante de una reserva por su ID numérico
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getReservationById(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.getReservationById(req.user, id);
  }
}
