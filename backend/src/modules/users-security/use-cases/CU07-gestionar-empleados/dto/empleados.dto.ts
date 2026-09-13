import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  IsEmail,
  Min,
  MinLength,
  IsIn,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEmployeesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rol?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sucursal?: number;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: 'activo' | 'inactivo';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

export class CreateEmployeeDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsString()
  @IsNotEmpty({ message: 'El código de empleado es obligatorio' })
  codigo_empleado: string;

  @IsString()
  @IsNotEmpty({ message: 'El CI es obligatorio' })
  ci: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsDateString({}, { message: 'La fecha de contratación debe tener un formato de fecha válido' })
  @IsNotEmpty({ message: 'La fecha de contratación es obligatoria' })
  fecha_contratacion: string;

  @IsInt({ message: 'El rol debe ser un número entero' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @Type(() => Number)
  id_rol: number;

  @IsArray({ message: 'Las sucursales deben ser una lista de IDs' })
  @IsInt({ each: true, message: 'Cada ID de sucursal debe ser un número entero' })
  @Type(() => Number)
  sucursales: number[];

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: 'activo' | 'inactivo' = 'activo';
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsString()
  ci?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de contratación debe tener un formato de fecha válido' })
  fecha_contratacion?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_rol?: number;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  sucursales?: number[];

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: 'activo' | 'inactivo';
}

export class UpdateEmployeeStatusDto {
  @IsIn(['activo', 'inactivo'], { message: 'El estado debe ser "activo" o "inactivo"' })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado: 'activo' | 'inactivo';
}
