import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportType {
  ECONOMIC = 'economico',
  SALES = 'ventas',
  TOP_PRODUCTS = 'productos_top',
  SALES_BY_BRANCH = 'ventas_sucursal',
  PAYMENT_METHODS = 'metodos_pago',
  INVENTORY = 'inventario',
  CRITICAL_INVENTORY = 'inventario_critico',
  MOVEMENTS = 'movimientos',
  RESERVATIONS = 'reservas',
  RETURNS = 'devoluciones',
  PURCHASES = 'compras',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

export class QueryDashboardDto {
  @IsOptional()
  @IsString()
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  fecha_fin?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_sucursal?: number;
}

export class QueryReportDto {
  @IsEnum(ReportType, {
    message:
      'Tipo de reporte inválido. Debe ser: economico, ventas, productos_top, ventas_sucursal, metodos_pago, inventario, inventario_critico, movimientos, reservas, devoluciones o compras',
  })
  tipo_reporte!: ReportType;

  @IsOptional()
  @IsString()
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  fecha_fin?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_sucursal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @IsOptional()
  @IsString()
  tipo_venta?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsEnum(ExportFormat)
  formato?: ExportFormat;
}
