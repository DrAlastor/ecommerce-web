/**
 * @caso-de-uso CU16 — Gestionar movimientos de inventario
 * @subsistema Sucursales e Inventario
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador o Encargado -> formulario de movimiento -> controlador de inventario -> servicio transaccional -> MovimientoInventario/Inventario/Variante/Sucursal.
 */
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'devolucion' | 'reserva' | 'salida_venta';

export class CreateMovementDto {
  @IsNotEmpty({ message: 'El tipo de movimiento es obligatorio' })
  @IsIn(['entrada', 'salida', 'ajuste', 'devolucion'], {
    message: 'El tipo de movimiento debe ser entrada, salida, ajuste o devolucion',
  })
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'devolucion';

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Type(() => Number)
  cantidad: number;

  @IsInt({ message: 'El ID de la variante es obligatorio' })
  @Type(() => Number)
  id_producto_variante: number;

  @IsInt({ message: 'El ID de la sucursal es obligatorio' })
  @Type(() => Number)
  id_sucursal: number;

  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @IsString()
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres' })
  motivo: string;
}

export class QueryMovementsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_sucursal?: number;

  @IsOptional()
  @IsString()
  tipo_movimiento?: string;

  @IsOptional()
  @IsString()
  fecha_desde?: string;

  @IsOptional()
  @IsString()
  fecha_hasta?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 15;
}
