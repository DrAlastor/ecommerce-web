import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelReservationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}

export class QueryMyReservationsDto {
  @IsOptional()
  @IsIn(['activas', 'historicas', 'todas'])
  tipo?: 'activas' | 'historicas' | 'todas';

  @IsOptional()
  @IsString()
  estado?: string;
}
