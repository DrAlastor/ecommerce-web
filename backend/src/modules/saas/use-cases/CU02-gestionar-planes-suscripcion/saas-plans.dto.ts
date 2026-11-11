import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSaasPlanDto {
  @IsString()
  codigo!: string;

  @IsString()
  nombre!: string;

  @IsString()
  tipo_plan!: string;

  @IsString()
  descripcion!: string;

  @IsNumber()
  @Min(0)
  precio_mensual!: number;

  @IsNumber()
  @Min(0)
  precio_anual!: number;

  @IsString()
  moneda: string = 'USD';

  @IsNumber()
  @Min(0)
  duracion_prueba_dias: number = 0;

  @IsBoolean()
  requiere_pago: boolean = true;

  @IsNumber()
  @Min(1)
  limite_usuarios: number = 10;

  @IsNumber()
  @Min(1)
  limite_sucursales: number = 1;

  @IsNumber()
  @Min(1)
  limite_almacenes: number = 1;

  @IsNumber()
  @Min(1)
  limite_productos: number = 1000;

  @IsBoolean()
  @IsOptional()
  permite_offline?: boolean = true;

  @IsBoolean()
  @IsOptional()
  permite_ia_reportes?: boolean = false;

  @IsBoolean()
  @IsOptional()
  permite_ml_analytics?: boolean = false;

  @IsBoolean()
  @IsOptional()
  activo?: boolean = true;
}

export class UpdateSaasPlanDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  tipo_plan?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_mensual?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_anual?: number;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  duracion_prueba_dias?: number;

  @IsBoolean()
  @IsOptional()
  requiere_pago?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limite_usuarios?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limite_sucursales?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limite_almacenes?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limite_productos?: number;

  @IsBoolean()
  @IsOptional()
  permite_offline?: boolean;

  @IsBoolean()
  @IsOptional()
  permite_ia_reportes?: boolean;

  @IsBoolean()
  @IsOptional()
  permite_ml_analytics?: boolean;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

