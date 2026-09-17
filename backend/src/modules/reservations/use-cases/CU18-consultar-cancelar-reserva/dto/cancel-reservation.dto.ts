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
