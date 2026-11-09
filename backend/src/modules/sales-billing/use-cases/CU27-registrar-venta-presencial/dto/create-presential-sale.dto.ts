/**
 * @caso-de-uso CU24 — Registrar venta presencial
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cajero -> punto de venta -> controlador de ventas -> servicio transaccional -> Venta/DetalleVenta/Pago/Inventario.
 */
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PresentialSaleItemDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID de la variante debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la variante es obligatorio' })
  id_producto_variante!: number;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  cantidad!: number;
}

export class CreatePresentialSaleDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la sucursal es obligatorio' })
  id_sucursal!: number;

  @IsArray({ message: 'Los artículos deben enviarse como una lista' })
  @ArrayMinSize(1, { message: 'Debe agregar al menos una prenda para la venta' })
  @ValidateNested({ each: true })
  @Type(() => PresentialSaleItemDto)
  items!: PresentialSaleItemDto[];

  @IsIn(['efectivo', 'tarjeta', 'qr'], {
    message: 'El método de pago debe ser: efectivo, tarjeta o qr',
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  metodo_pago!: 'efectivo' | 'tarjeta' | 'qr';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto recibido debe ser un número válido' })
  @Min(0.01, { message: 'El monto recibido debe ser mayor a 0' })
  monto_recibido?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID del cliente debe ser un número entero' })
  id_cliente?: number;

  @IsOptional()
  @IsString({ message: 'El CI o NIT del cliente debe ser texto' })
  cliente_ci?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del cliente debe ser texto' })
  cliente_nombre?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono del cliente debe ser texto' })
  cliente_telefono?: string;

  @IsOptional()
  @IsString({ message: 'El NIT para factura debe ser texto' })
  nit_factura?: string;

  @IsOptional()
  @IsString({ message: 'La razón social para factura debe ser texto' })
  razon_social_factura?: string;

  @IsOptional()
  @IsString({ message: 'La transacción externa o referencia de pago debe ser texto' })
  transaccion_externa?: string;
}
