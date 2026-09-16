export interface InventoryBranch {
  id_sucursal: number;
  nombre: string;
  ciudad: string;
}

export interface InventoryItem {
  id_inventario_sucursal: number;
  stock_disponible: number;
  stock_reservado: number;
  stock_total: number;
  stock_minimo: number;
  estado_stock: 'normal' | 'bajo' | 'agotado';
  ultima_actualizacion: string;
  sucursal: InventoryBranch;
  variante: {
    id_producto_variante: number;
    sku: string;
    imagen_url: string | null;
    precio: number;
    producto_id: number;
    producto_nombre: string;
    categoria: string;
    talla: string;
    color: {
      nombre: string;
      codigo_hex: string | null;
    };
  };
}

export interface InventoryStats {
  total_disponible: number;
  total_reservado: number;
  items_bajo_stock: number;
  items_agotados: number;
}

export interface InventoryMetadata {
  branches: InventoryBranch[];
  sizes: Array<{ id_talla: number; codigo: string }>;
  colors: Array<{ id_color: number; nombre: string; codigo_hex: string | null }>;
  categories: Array<{ id_categoria: number; nombre: string }>;
  isSuperAdmin: boolean;
}

export interface InventoryPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryResponse {
  data: InventoryItem[];
  meta: InventoryPaginationMeta;
  stats: InventoryStats;
}

export interface InventoryQueryParams {
  search?: string;
  id_sucursal?: number;
  id_talla?: number;
  id_color?: number;
  stock_status?: 'todos' | 'disponible' | 'bajo' | 'agotado';
  page?: number;
  limit?: number;
}
