export interface FuncionDto {
  id_funcion: number;
  nombre: string;
  modulo: string;
  nivel_acceso: string;
}

export interface RolDto {
  id_rol: number;
  nombre: string;
}

export interface UserDto {
  id_usuario: number;
  email: string;
  estado: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: UserDto;
  rol: RolDto;
  funciones: FuncionDto[];
}
