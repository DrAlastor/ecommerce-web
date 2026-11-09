/**
 * @caso-de-uso CU22 — Consultar historial de compras
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> historial -> controlador de compras -> servicio de historial -> Venta/DetalleVenta/Pago.
 */
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchasesFilterDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tipo_venta?: string;

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
