/**
 * @caso-de-uso CU23 — Procesar pago electrónico y facturación
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> interfaz de pago -> controlador de pagos -> servicio de pago y facturación -> Pasarela de Pago/Pago/Venta/Factura.
 */
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessPaymentDto {
  @IsInt({ message: 'El ID de la venta debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la venta es obligatorio' })
  id_venta!: number;

  @IsIn(['tarjeta', 'stripe', 'qr', 'transferencia', 'efectivo'], {
    message: 'El método de pago debe ser: tarjeta, stripe, qr, transferencia o efectivo',
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  metodo_pago!: 'tarjeta' | 'stripe' | 'qr' | 'transferencia' | 'efectivo';

  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0.01, { message: 'El monto mínimo a pagar es 0.01 Bs' })
  monto!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto recibido debe ser un número válido' })
  @Min(0.01, { message: 'El monto recibido debe ser mayor a 0' })
  monto_recibido?: number;

  @IsOptional()
  @IsString({ message: 'La transacción externa o comprobante debe ser texto' })
  transaccion_externa?: string;

  @IsOptional()
  @IsString({ message: 'El NIT o CI en factura debe ser texto' })
  nit_factura?: string;

  @IsOptional()
  @IsString({ message: 'La razón social debe ser texto' })
  razon_social_factura?: string;
}

export class CreatePendingSaleDto {
  @IsOptional()
  @IsInt({ message: 'El ID del cliente debe ser un número entero' })
  id_cliente?: number;

  @IsOptional()
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  id_sucursal?: number;

  @IsNotEmpty({ message: 'Debe incluir al menos un producto' })
  items!: {
    id_producto_variante: number;
    cantidad: number;
  }[];
}
