export interface PublicCity {
  id_ciudad: number;
  nombre: string;
  pais: string;
  total_sucursales: number;
}

export interface PublicBranch {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono: string;
  hora_apertura: string | null; // e.g. "10:00"
  hora_cierre: string | null;   // e.g. "22:00"
  estado: string;
  id_ciudad: number;
  ciudad: {
    id_ciudad: number;
    nombre: string;
    pais: string;
  };
}

export interface BranchQueryParams {
  id_ciudad?: number;
  search?: string;
}
