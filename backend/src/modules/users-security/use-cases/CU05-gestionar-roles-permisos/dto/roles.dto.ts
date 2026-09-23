/**
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Administrador -> vista de roles -> controlador de autorización -> servicio de roles -> Rol/Función/Acción/Permisos.
 */
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RolePermissionItemDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  id_funcion: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Lectura', 'Edicion', 'Edición'])
  nivel_acceso: string;
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionItemDto)
  permissions: RolePermissionItemDto[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  permiso?: string;
}
