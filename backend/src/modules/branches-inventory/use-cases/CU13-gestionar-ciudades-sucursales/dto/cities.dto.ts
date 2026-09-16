import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCityDto {
  @IsString({ message: 'El nombre de la ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la ciudad es obligatorio' })
  @MinLength(2, { message: 'El nombre de la ciudad debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la ciudad no puede exceder 100 caracteres' })
  nombre: string;

  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El país es obligatorio' })
  @MinLength(2, { message: 'El país debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
  pais: string;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString({ message: 'El nombre de la ciudad debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre de la ciudad debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la ciudad no puede exceder 100 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @MinLength(2, { message: 'El país debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
  pais?: string;
}

export class QueryCitiesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
