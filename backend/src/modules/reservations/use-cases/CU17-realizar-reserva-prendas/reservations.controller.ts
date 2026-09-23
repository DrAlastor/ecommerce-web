/**
 * @file reservations.controller.ts
 * @caso-de-uso CU17 — Realizar reserva de prendas
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @caso-de-uso CU19 — Gestionar reserva en sucursal
 * @subsistema Reservas
 * @capa Control (API REST) — Backend
 * @responsabilidad Proporciona endpoints protegidos por autenticación JWT y RBAC para:
 * - Consulta pública o autenticada de disponibilidad de variantes por sucursal.
 * - Creación de reservas temporales omnicanal bloqueando existencias en tienda.
 * - Consulta de historial y cancelación voluntaria por parte del cliente.
 * - Gestión operativa en mostrador de tienda (recepción, preparación, atención y entrega).
 */

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

/**
 * Controlador omnicanal para el ciclo de vida de reservas de prendas.
 */
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * CU19: Consulta las sucursales físicas a las que el personal autenticado está asignado.
   *
   * @param {any} req - Objeto Request con usuario y sucursales asignadas.
   * @returns {Promise<Array>} Tiendas físicas donde el operador tiene jurisdicción.
   */
  @Get('branch/my-branches')
  @UseGuards(JwtAuthGuard, FunctionGuard)
  @FunctionRequired('Gestionar Reserva en Sucursal', 'Lectura')
  async getBranchStaffBranches(@Req() req: any) {
    return this.reservationsService.getBranchStaffBranches(req.user);
  }

  /**
   * CU19: Lista las reservas operativas de la sucursal para el personal de mostrador
   * con soporte para filtrado por estado, rango de fechas y paginación.
   *
   * @param {any} req - Objeto Request con usuario autenticado.
   * @param {QueryBranchReservationsDto} query - Filtros operativos de sucursal.
   * @returns {Promise<Object>} Reservas de la sucursal y métricas de estado.
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
   * CU19: Actualiza el estado de una reserva en sucursal (Pendiente, Preparada, Atendida, Completada, Cancelada)
   * y gestiona el traspaso o liberación de inventario según corresponda.
   *
   * @param {any} req - Objeto Request con datos de auditoría.
   * @param {number} id - ID de la reserva.
   * @param {UpdateBranchReservationStatusDto} dto - Nuevo estado y notas operativas.
   * @returns {Promise<Object>} Reserva actualizada.
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
   * Consulta las sucursales activas y existencias disponibles en stock para una variante específica.
   *
   * @param {number} variantId - ID de la variante de producto.
   * @returns {Promise<Object>} Variante con su desglose de disponibilidad en cada sucursal física.
   */
  @Get('branch-availability/:variantId')
  async getBranchAvailability(
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.reservationsService.getBranchAvailability(variantId);
  }

  /**
   * Alias de ruta para compatibilidad móvil de consulta de disponibilidad.
   */
  @Get('availability/:variantId')
  async getBranchAvailabilityAlias(
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.reservationsService.getBranchAvailability(variantId);
  }

  /**
   * CU18: Consulta las reservas realizadas por el cliente autenticado con paginación y estados.
   *
   * @param {any} req - Objeto Request con el usuario cliente.
   * @param {QueryMyReservationsDto} query - Filtro por estado y paginación.
   * @returns {Promise<Object>} Lista de reservas del cliente con ítems y comprobantes.
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
   * CU17: Registra una nueva reserva temporal de prendas en una sucursal física,
   * bloqueando stock disponible a stock reservado mediante transacción atómica.
   *
   * @param {any} req - Objeto Request con cliente autenticado e IP.
   * @param {CreateReservationDto} dto - Sucursal, ítems a reservar y fecha de expiración.
   * @returns {Promise<Object>} Reserva creada con código único y comprobante.
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
   * CU18: Cancela una reserva activa del cliente y libera automáticamente el inventario reservado
   * devolviéndolo a stock disponible en la sucursal física.
   *
   * @param {any} req - Objeto Request con cliente autenticado.
   * @param {number} id - ID de la reserva a cancelar.
   * @param {CancelReservationDto} dto - Motivo de la cancelación voluntaria.
   * @returns {Promise<Object>} Confirmación de cancelación.
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
   * Consulta el comprobante y ficha digital de una reserva por su código alfanumérico único.
   *
   * @param {any} req - Objeto Request para validar pertenencia o rol de empleado.
   * @param {string} code - Código único (ej. "RES-20260923-1234").
   * @returns {Promise<Object>} Detalle de la reserva.
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
   * Consulta el comprobante y ficha digital de una reserva por su identificador numérico de base de datos.
   *
   * @param {any} req - Objeto Request para verificar permisos de visualización.
   * @param {number} id - ID numérico de la reserva.
   * @returns {Promise<Object>} Detalle de la reserva.
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
