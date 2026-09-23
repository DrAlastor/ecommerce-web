/**
 * @caso-de-uso CU13 — Gestionar ciudades y sucursales
 * @subsistema Sucursales e Inventario
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador -> vista de sucursales -> controlador geográfico -> servicio de sucursales -> Ciudad/Sucursal.
 */
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString({ message: 'El nombre de la sucursal debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MinLength(3, { message: 'La dirección debe tener al menos 3 caracteres' })
  direccion: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(30, { message: 'El teléfono no puede exceder 30 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'El formato de hora de apertura debe ser válido' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de apertura debe tener el formato HH:mm (ej: 09:00)',
  })
  hora_apertura?: string;

  @IsOptional()
  @IsString({ message: 'El formato de hora de cierre debe ser válido' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de cierre debe tener el formato HH:mm (ej: 21:00)',
  })
  hora_cierre?: string;

  @Type(() => Number)
  @IsInt({ message: 'El ID de la ciudad debe ser un número entero' })
  @IsNotEmpty({ message: 'Debe asociar una ciudad a la sucursal' })
  id_ciudad: number;

  @IsOptional()
  @IsString()
  @IsIn(['activo', 'inactivo'], {
    message: 'El estado debe ser "activo" o "inactivo"',
  })
  estado?: string = 'activo';
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString({ message: 'El nombre de la sucursal debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MinLength(3, { message: 'La dirección debe tener al menos 3 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(30, { message: 'El teléfono no puede exceder 30 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'El formato de hora de apertura debe ser válido' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de apertura debe tener el formato HH:mm (ej: 09:00)',
  })
  hora_apertura?: string;

  @IsOptional()
  @IsString({ message: 'El formato de hora de cierre debe ser válido' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de cierre debe tener el formato HH:mm (ej: 21:00)',
  })
  hora_cierre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la ciudad debe ser un número entero' })
  id_ciudad?: number;

  @IsOptional()
  @IsString()
  @IsIn(['activo', 'inactivo'], {
    message: 'El estado debe ser "activo" o "inactivo"',
  })
  estado?: string;
}

export class UpdateBranchStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsIn(['activo', 'inactivo'], {
    message: 'El estado debe ser "activo" o "inactivo"',
  })
  estado: string;
}

export class QueryBranchesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_ciudad?: number;

  @IsOptional()
  @IsString()
  estado?: string;

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
