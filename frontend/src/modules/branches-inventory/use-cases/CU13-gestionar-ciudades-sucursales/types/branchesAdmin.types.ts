export interface City {
  id_ciudad: number;
  nombre: string;
  pais: string;
  total_sucursales?: number;
  total_direcciones?: number;
}

export interface BranchCounts {
  empleados: number;
  inventario: number;
  movimientos: number;
  ordenes: number;
  reservas: number;
}

export interface Branch {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
  estado: 'activo' | 'inactivo';
  id_ciudad: number;
  ciudad: {
    id_ciudad: number;
    nombre: string;
    pais: string;
  };
  tiene_historial?: boolean;
  conteos?: BranchCounts;
}

export interface BranchEmployee {
  id_empleado: number;
  nombre: string;
  codigo_empleado?: string;
  cargo: string;
  ci: string;
  email?: string;
  rol?: string;
}

export interface BranchMetrics {
  empleados_asignados: number;
  variantes_inventario: number;
  movimientos_registrados: number;
  ordenes_compra: number;
  reservas_recibidas: number;
}

export interface BranchDetail extends Branch {
  empleados: BranchEmployee[];
  metricas: BranchMetrics;
}

export interface MetadataEmployee {
  id_empleado: number;
  nombre_completo: string;
  codigo_empleado: string;
  cargo: string;
  ci: string;
  email: string;
  rol: string;
  sucursales_actuales: string[];
}

export interface BranchesMetadata {
  cities: City[];
  employees: MetadataEmployee[];
}

export interface CreateBranchPayload {
  nombre: string;
  direccion: string;
  telefono?: string;
  hora_apertura?: string;
  hora_cierre?: string;
  id_ciudad: number;
  estado?: 'activo' | 'inactivo';
}

export interface UpdateBranchPayload {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  hora_apertura?: string;
  hora_cierre?: string;
  id_ciudad?: number;
  estado?: 'activo' | 'inactivo';
}

export interface CreateCityPayload {
  nombre: string;
  pais: string;
}

export interface UpdateCityPayload {
  nombre?: string;
  pais?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
