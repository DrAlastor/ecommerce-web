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
