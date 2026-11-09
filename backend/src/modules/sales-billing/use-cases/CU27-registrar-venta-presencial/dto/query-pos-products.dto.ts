/**
 * @caso-de-uso CU24 — Registrar venta presencial
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cajero -> punto de venta -> controlador de ventas -> servicio transaccional -> Venta/DetalleVenta/Pago/Inventario.
 */
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPOSProductsDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la sucursal es obligatorio' })
  id_sucursal!: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la categoría debe ser un número entero' })
  id_categoria?: number;
}
