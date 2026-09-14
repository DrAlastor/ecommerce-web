export interface CatalogColor {
  id_color: number;
  nombre: string;
  codigo_hex: string | null;
}

export interface CatalogSize {
  id_talla: number;
  codigo: string;
}

export interface CatalogImage {
  id_imagen_producto: number;
  url: string;
  es_principal: boolean;
}

export interface CatalogProduct {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  precio_final: number;
  tiene_descuento: boolean;
  descuento_porcentaje: number;
  promocion: {
    id_promocion: number;
    nombre: string;
    tipo_descuento: string;
    valor_descuento: number;
  } | null;
  genero: string | null;
  categoria: {
    id_categoria: number;
    nombre: string;
  } | null;
  coleccion: {
    id_coleccion: number;
    nombre: string;
    temporada: string | null;
  } | null;
  imagen_principal: string | null;
  imagenes: CatalogImage[];
  disponible: boolean;
  total_variantes: number;
  colores_disponibles: CatalogColor[];
  tallas_disponibles: CatalogSize[];
}

export interface CatalogCategoryMeta {
  id_categoria: number;
  nombre: string;
  total_productos: number;
}

export interface CatalogCollectionMeta {
  id_coleccion: number;
  nombre: string;
  temporada: string | null;
}

export interface CatalogFilterMetadata {
  categorias: CatalogCategoryMeta[];
  colecciones: CatalogCollectionMeta[];
  tallas: CatalogSize[];
  colores: CatalogColor[];
  generos: string[];
  precio_rango: {
    min: number;
    max: number;
  };
}

export interface CatalogResponse {
  data: CatalogProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CatalogQueryParams {
  search?: string;
  id_categoria?: number;
  categoria?: string;
  genero?: string;
  id_talla?: number;
  talla?: string;
  id_color?: number;
  color?: string;
  id_coleccion?: number;
  id_temporada?: number;
  min_price?: number;
  max_price?: number;
  en_oferta?: boolean;
  sort_by?: string;
  page?: number;
  limit?: number;
}
