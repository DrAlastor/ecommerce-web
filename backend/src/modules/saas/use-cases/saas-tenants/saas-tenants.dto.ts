import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTenantAdminDto {
  @IsString()
  @IsNotEmpty()
  nombre_comercial!: string;

  @IsString()
  @IsNotEmpty()
  razon_social!: string;

  @IsString()
  @IsOptional()
  nit?: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  ciudad_nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  planName?: string;

  @IsString()
  @IsOptional()
  estado?: 'ACTIVO' | 'PRUEBA' | 'SUSPENDIDO';

  @IsString()
  @IsOptional()
  adminPassword?: string;
}

export interface EnrichedTenantDetails {
  codigo_empresa: string;
  nombre_comercial: string;
  razon_social: string;
  nit: string;
  email: string;
  telefono: string;
  ciudad_nombre: string;
  direccion: string;
  pais: string;
  estado: string;
  planId: string;
  planName: string;
  monthlyFeeUSD: number;
  databaseName: string;
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  lastModified: string;
}

