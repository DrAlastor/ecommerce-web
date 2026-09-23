/**
 * @caso-de-uso Módulo heredado — Gestión de devoluciones
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Usuario autorizado -> vista de devoluciones -> controlador -> servicio de devoluciones -> Devolución/DetalleDevolución/Venta/Inventario.
 * Nota: módulo heredado; su numeración no corresponde al catálogo oficial de CU del informe.
 */
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReturnItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id_detalle_venta: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  cantidad: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class CreateReturnDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id_venta: number;

  @IsString()
  @IsNotEmpty({ message: 'El motivo de la devolución es obligatorio.' })
  motivo: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id_sucursal_reingreso?: number;

  @IsOptional()
  @IsBoolean()
  auto_procesar?: boolean;
}

export class UpdateReturnStatusDto {
  @IsString()
  @IsNotEmpty()
  estado: 'procesada' | 'rechazada' | 'pendiente';

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id_sucursal_reingreso?: number;
}

export class QueryReturnsDto {
  @IsOptional()
  @IsString()
  estado?: string;

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
