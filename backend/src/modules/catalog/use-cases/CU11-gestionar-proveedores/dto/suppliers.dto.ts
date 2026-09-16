import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
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

export class QuerySuppliersDto {
  @IsOptional()
  @IsString()
  search?: string;

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

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'La razon social es obligatoria' })
  razon_social: string;

  @IsString()
  @IsNotEmpty({ message: 'El NIT es obligatorio' })
  nit: string;

  @IsOptional()
  @IsString()
  contacto_nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo del proveedor no es valido' })
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  razon_social?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  contacto_nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}

export class CreateSupplierProductDto {
  @IsInt({ message: 'El producto es obligatorio' })
  @Type(() => Number)
  id_producto: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El costo de referencia debe ser numerico' })
  @Min(0, { message: 'El costo de referencia no puede ser negativo' })
  @Type(() => Number)
  costo_referencia?: number;

  @IsOptional()
  @IsIn(['DISPONIBLE', 'AGOTADO'])
  estado?: 'DISPONIBLE' | 'AGOTADO' = 'DISPONIBLE';
}

export class UpdateSupplierProductDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  costo_referencia?: number;

  @IsOptional()
  @IsIn(['DISPONIBLE', 'AGOTADO'])
  estado?: 'DISPONIBLE' | 'AGOTADO';
}

export class PurchaseOrderDetailDto {
  @IsInt({ message: 'La variante es obligatoria' })
  @Type(() => Number)
  id_producto_variante: number;

  @IsInt({ message: 'La cantidad debe ser un entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a cero' })
  @Type(() => Number)
  cantidad: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El costo unitario debe ser numerico' })
  @Min(0.01, { message: 'El costo unitario debe ser mayor a cero' })
  @Type(() => Number)
  costo_unitario: number;

  @IsInt({ message: 'La temporada es obligatoria' })
  @Type(() => Number)
  id_temporada: number;
}

export class CreatePurchaseOrderDto {
  @IsInt({ message: 'El proveedor es obligatorio' })
  @Type(() => Number)
  id_proveedor: number;

  @IsInt({ message: 'La sucursal de destino es obligatoria' })
  @Type(() => Number)
  id_sucursal: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha estimada debe ser una fecha valida' })
  fecha_estimada?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'La orden debe tener al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  detalles: PurchaseOrderDetailDto[];
}

export class QueryPurchaseOrdersDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_proveedor?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_sucursal?: number;

  @IsOptional()
  @IsIn(['pendiente', 'en_transito', 'recibida', 'cancelada'])
  estado?: 'pendiente' | 'en_transito' | 'recibida' | 'cancelada';
}

export class UpdatePurchaseOrderStatusDto {
  @IsIn(['pendiente', 'en_transito', 'cancelada'])
  estado: 'pendiente' | 'en_transito' | 'cancelada';
}

export class ReceivePurchaseOrderDto {
  @IsOptional()
  @IsDateString()
  fecha_recepcion?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_empleado_responsable?: number;
}
