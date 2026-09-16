import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservationItemDto {
  @IsInt()
  @IsPositive()
  id_producto_variante: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateReservationDto {
  @IsInt()
  @IsPositive()
  id_sucursal: number;

  @IsOptional()
  @IsString()
  fecha_visita?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // Permite llamada con array de items
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReservationItemDto)
  items?: CreateReservationItemDto[];

  // O llamada directa simplificada para una sola prenda
  @IsOptional()
  @IsInt()
  @IsPositive()
  id_producto_variante?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;
}
