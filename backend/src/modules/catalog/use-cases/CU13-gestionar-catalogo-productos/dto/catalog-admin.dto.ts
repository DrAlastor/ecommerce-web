/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  IsIn,
  IsArray,
  IsDateString,
  IsNumber,
  Matches,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// PRODUCT DTOs
// ==========================================

export class QueryAdminProductsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_categoria?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_coleccion?: number;

  @IsOptional()
  @IsString()
  genero?: string;

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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio base debe ser numérico' })
  @Min(0, { message: 'El precio base no puede ser negativo' })
  @Type(() => Number)
  precio_base: number;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string = 'activo';

  @IsInt({ message: 'La categoría es obligatoria' })
  @Type(() => Number)
  id_categoria: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_coleccion?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  precio_base?: number;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_categoria?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_coleccion?: number;
}

export class UpdateStatusDto {
  @IsIn(['activo', 'inactivo'], { message: 'El estado debe ser activo o inactivo' })
  estado: 'activo' | 'inactivo';
}

// ==========================================
// VARIANT DTOs
// ==========================================

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty({ message: 'El SKU es obligatorio' })
  sku: string;

  @IsInt({ message: 'La talla es obligatoria' })
  @Type(() => Number)
  id_talla: number;

  @IsInt({ message: 'El color es obligatorio' })
  @Type(() => Number)
  id_color: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio adicional no puede ser negativo' })
  @Type(() => Number)
  precio_adicional?: number = 0;

  @IsOptional()
  @IsString()
  modelo_3d_url?: string;

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string = 'activo';
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_talla?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_color?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  precio_adicional?: number;

  @IsOptional()
  @IsString()
  modelo_3d_url?: string;

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;
}

// ==========================================
// CATEGORY DTOs
// ==========================================

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_categoria_padre?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_categoria_padre?: number;
}

// ==========================================
// SIZE & COLOR DTOs
// ==========================================

export class CreateSizeDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de la talla es obligatorio' })
  codigo: string;
}

export class CreateColorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del color es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'El código HEX debe tener formato #RRGGBB o #RGB válido',
  })
  codigo_hex?: string;
}

export class UpdateColorDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'El código HEX debe tener formato #RRGGBB o #RGB válido',
  })
  codigo_hex?: string;
}

// ==========================================
// SEASON & COLLECTION DTOs
// ==========================================

export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la temporada es obligatorio' })
  nombre: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fecha_inicio: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fecha_fin: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string = 'activo';
}

export class UpdateSeasonDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;
}

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la colección es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_temporada?: number;
}

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_temporada?: number;
}

// ==========================================
// SIZE GUIDE DTOs
// ==========================================

export class CreateSizeGuideDto {
  @IsInt({ message: 'La categoría es obligatoria' })
  @Type(() => Number)
  id_categoria: number;

  @IsString()
  @IsNotEmpty({ message: 'La parte del cuerpo es obligatoria' })
  parte_cuerpo: string;

  @IsString()
  @IsNotEmpty({ message: 'La talla de etiqueta es obligatoria' })
  talla_etiqueta: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  min_cm: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  max_cm: number;
}

export class UpdateSizeGuideDto {
  @IsOptional()
  @IsString()
  parte_cuerpo?: string;

  @IsOptional()
  @IsString()
  talla_etiqueta?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  min_cm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  max_cm?: number;
}

// ==========================================
// PROMOTION DTOs
// ==========================================

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la promoción es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limite_usos?: number;

  @IsIn(['porcentaje', 'monto_fijo'], {
    message: 'El tipo de descuento debe ser porcentaje o monto_fijo',
  })
  tipo_descuento: 'porcentaje' | 'monto_fijo';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El valor de descuento debe ser mayor a 0' })
  @Type(() => Number)
  valor_descuento: number;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fecha_inicio: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fecha_fin: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string = 'activo';

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  product_ids?: number[];
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limite_usos?: number;

  @IsOptional()
  @IsIn(['porcentaje', 'monto_fijo'])
  tipo_descuento?: 'porcentaje' | 'monto_fijo';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  valor_descuento?: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;
}

export class AssignPromotionProductsDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  product_ids: number[];
}

// ==========================================
// PRODUCT IMAGE DTOs
// ==========================================

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria' })
  url: string;

  @IsOptional()
  @IsString()
  texto_alternativo?: string;

  @IsOptional()
  es_principal?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  orden?: number = 0;
}
