import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPOSProductsDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la sucursal es obligatorio' })
  id_sucursal!: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la categoría debe ser un número entero' })
  id_categoria?: number;
}
