import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  role?: number;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  estado: UserStatus;
}

export class UpdateUserAdminDto {
  @IsOptional()
  @IsInt()
  id_rol?: number;

  @IsOptional()
  @IsString()
  email?: string;
}
