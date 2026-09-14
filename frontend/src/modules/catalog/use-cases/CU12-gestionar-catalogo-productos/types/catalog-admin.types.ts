export type CatalogTabKey =
  | 'products'
  | 'categories'
  | 'sizes-colors'
  | 'seasons-collections'
  | 'size-guides'
  | 'promotions';

export interface AdminProduct {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  genero: string | null;
  estado: string;
  categoria: { id_categoria: number; nombre: string };
  coleccion?: { id_coleccion: number; nombre: string } | null;
  imagen_principal: string;
  total_variantes: number;
  total_imagenes: number;
  variantes?: AdminVariant[];
  promocion_activa?: {
    id_promocion: number;
    nombre: string;
    tipo_descuento: string;
    valor_descuento: number;
  } | null;
}

export interface AdminVariant {
  id_producto_variante: number;
  id_producto?: number;
  sku: string;
  precio_adicional: number;
  modelo_3d_url: string | null;
  imagen_url: string | null;
  estado: string;
  talla: { id_talla: number; codigo: string };
  color: { id_color: number; nombre: string; codigo_hex: string | null };
  total_stock?: number;
}

export interface AdminCategory {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  id_categoria_padre: number | null;
  categoria_padre_nombre?: string | null;
  total_subcategorias: number;
  total_productos: number;
  total_guias: number;
}

export interface AdminSize {
  id_talla: number;
  codigo: string;
  _count?: { producto_variante: number };
}

export interface AdminColor {
  id_color: number;
  nombre: string;
  codigo_hex: string | null;
  _count?: { producto_variante: number };
}

export interface AdminSeason {
  id_temporada: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  _count?: { coleccion: number };
}

export interface AdminCollection {
  id_coleccion: number;
  nombre: string;
  descripcion: string | null;
  id_temporada: number | null;
  temporada?: { id_temporada?: number; nombre: string } | null;
  _count?: { producto: number };
}

export interface AdminSizeGuide {
  id_guia_talla: number;
  id_categoria: number;
  parte_cuerpo: string;
  talla_etiqueta: string;
  min_cm: number;
  max_cm: number;
  categoria?: { id_categoria: number; nombre: string };
}

export interface AdminPromotion {
  id_promocion: number;
  nombre: string;
  limite_usos: number | null;
  usos_actuales: number;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  productos_asociados?: Array<{ id_producto: number; nombre: string }>;
}

export interface CatalogMetadata {
  categories: Array<{ id_categoria: number; nombre: string; id_categoria_padre: number | null }>;
  sizes: Array<{ id_talla: number; codigo: string }>;
  colors: Array<{ id_color: number; nombre: string; codigo_hex: string | null }>;
  seasons: Array<{ id_temporada: number; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string }>;
  collections: Array<{ id_coleccion: number; nombre: string; id_temporada: number | null; temporada?: { nombre: string } | null }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
