/**
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador o Encargado -> vista de inventario -> controlador de inventario -> servicio de existencias -> Inventario/Variante/Sucursal.
 */
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum StockStatusFilter {
  TODOS = 'todos',
  DISPONIBLE = 'disponible',
  BAJO = 'bajo',
  AGOTADO = 'agotado',
}

export class QueryInventoryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_sucursal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_talla?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_color?: number;

  @IsOptional()
  @IsEnum(StockStatusFilter)
  stock_status?: StockStatusFilter = StockStatusFilter.TODOS;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;
}
