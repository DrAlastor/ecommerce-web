import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReservationStatusEnum {
  PENDIENTE = 'Pendiente',
  PREPARADA = 'Preparada',
  ATENDIDA = 'Atendida',
  COMPLETADA = 'Completada',
  CANCELADA = 'Cancelada',
  EXPIRADA = 'Expirada',
}

export class QueryBranchReservationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sucursalId?: number;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}

export class UpdateBranchReservationStatusDto {
  @IsEnum(ReservationStatusEnum, {
    message: 'El nuevo estado debe ser: Preparada, Atendida, Completada o Cancelada',
  })
  nuevo_estado: ReservationStatusEnum;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  motivo?: string;
}
