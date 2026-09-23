/**
 * @caso-de-uso CU18 — Consultar y cancelar reserva
 * @subsistema Reservas
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> listado de reservas -> controlador de reservas -> servicio de cancelación -> Reserva/DetalleReserva/Inventario.
 */
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelReservationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}

export class QueryMyReservationsDto {
  @IsOptional()
  @IsIn(['activas', 'historicas', 'historico', 'todas'])
  tipo?: 'activas' | 'historicas' | 'historico' | 'todas';

  @IsOptional()
  @IsString()
  filtro?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
