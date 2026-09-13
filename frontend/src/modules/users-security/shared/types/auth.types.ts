export interface LoginRequest {
  email: string;
  password: string;
}

export interface FuncionInfo {
  id_funcion: number;
  nombre: string;
  modulo: string;
  nivel_acceso: string;
}

export interface RolInfo {
  id_rol: number;
  nombre: string;
}

export interface AuthUser {
  id_usuario: number;
  email: string;
  estado: string;
  cliente?: {
    id_cliente: number;
    nombre: string;
    apellido: string;
  };
  empleado?: {
    id_empleado: number;
    nombre: string;
    apellido: string;
    codigo_empleado: string;
    ci: string;
    telefono: string | null;
    fecha_contratacion: string;
    estado: string;
  };
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  rol: RolInfo;
  funciones: FuncionInfo[];
}

export interface ProfileResponse {
  user: AuthUser & {
    id_rol: number;
    cliente?: {
      id_cliente: number;
      nombre: string;
      apellido: string;
    };
    empleado?: {
      id_empleado: number;
      nombre: string;
      apellido: string;
      codigo_empleado: string;
    };
  };
  rol: RolInfo;
  funciones: FuncionInfo[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  rol: RolInfo | null;
  funciones: FuncionInfo[];
  accessToken: string | null;
}
