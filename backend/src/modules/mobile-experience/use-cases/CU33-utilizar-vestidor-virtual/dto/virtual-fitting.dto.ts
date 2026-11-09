/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO para registrar interacción de vestidor virtual.
 * Solo requiere el id_producto; el id_cliente se obtiene del JWT.
 */
export class RegisterFittingInteractionDto {
  @IsInt()
  @IsPositive()
  id_producto: number;
}

/* ─────────────────────────── Response DTOs ─────────────────────────── */

export interface ArVariantDto {
  id_producto_variante: number;
  sku: string;
  precio_variante: number;
  precio_final: number;
  tiene_descuento: boolean;
  descuento_porcentaje: number;
  modelo_3d_url: string;
  imagen_url: string | null;
  estado: string;
  talla: { id_talla: number; codigo: string };
  color: { id_color: number; nombre: string; codigo_hex: string | null };
  total_stock: number;
}

export interface ArVariantDetailDto extends ArVariantDto {
  producto: {
    id_producto: number;
    nombre: string;
    descripcion: string | null;
    precio_base: number;
    categoria: string;
  };
}

export interface ArVariantsResponseDto {
  producto: {
    id_producto: number;
    nombre: string;
    descripcion: string | null;
    precio_base: number;
    categoria: string;
  };
  variantes: ArVariantDto[];
  tallas_disponibles: Array<{ id_talla: number; codigo: string }>;
  colores_disponibles: Array<{ id_color: number; nombre: string; codigo_hex: string | null }>;
}
