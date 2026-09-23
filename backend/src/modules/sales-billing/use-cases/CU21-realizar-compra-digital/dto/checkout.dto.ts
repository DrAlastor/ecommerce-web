/**
 * @caso-de-uso CU21 — Realizar compra digital
 * @subsistema Ventas, Pagos y Compras
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> checkout -> controlador de compra -> servicios de compra y pago -> Venta/DetalleVenta/Pago/Inventario.
 */
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NuevaDireccionDto {
  @IsString({ message: 'El destinatario es obligatorio' })
  @IsNotEmpty({ message: 'El destinatario no puede estar vacío' })
  destinatario!: string;

  @IsString({ message: 'El teléfono es obligatorio' })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  telefono!: string;

  @IsString({ message: 'La calle y dirección son obligatorias' })
  @IsNotEmpty({ message: 'La dirección no puede estar vacía' })
  calle!: string;

  @IsString({ message: 'El detalle de entrega debe ser texto' })
  @IsOptional()
  detalle?: string;

  @IsInt({ message: 'La ciudad debe ser un número entero' })
  @Min(1, { message: 'Debe seleccionar una ciudad válida' })
  id_ciudad!: number;
}

export class CreatePaymentIntentDto {
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ProcessDigitalPurchaseDto {
  @IsString({ message: 'El método de pago es obligatorio' })
  @IsIn(['stripe', 'qr', 'transferencia'], {
    message: 'El método de pago debe ser stripe, qr o transferencia',
  })
  metodo_pago!: 'stripe' | 'qr' | 'transferencia';

  @IsString({ message: 'El tipo de entrega es obligatorio' })
  @IsIn(['domicilio', 'retiro_sucursal'], {
    message: 'El tipo de entrega debe ser domicilio o retiro_sucursal',
  })
  tipo_entrega!: 'domicilio' | 'retiro_sucursal';

  @IsOptional()
  @IsInt({ message: 'El ID de dirección debe ser un entero' })
  id_direccion?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NuevaDireccionDto)
  nueva_direccion?: NuevaDireccionDto;

  @IsOptional()
  @IsInt({ message: 'La sucursal de retiro debe ser un entero' })
  id_sucursal_retiro?: number;

  @IsOptional()
  @IsString({ message: 'El ID de transacción o referencia debe ser texto' })
  transaccion_externa?: string;

  @IsOptional()
  @IsString({ message: 'El NIT o CI para la factura debe ser texto' })
  nit_factura?: string;

  @IsOptional()
  @IsString({ message: 'La razón social para la factura debe ser texto' })
  razon_social_factura?: string;
}
