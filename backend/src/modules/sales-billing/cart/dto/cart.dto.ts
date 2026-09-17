import { IsArray, IsInt, IsNotEmpty, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsOptional()
  @IsInt({ message: 'El ID de la variante debe ser un número entero' })
  id_producto_variante?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del producto debe ser un número entero' })
  id_producto?: number;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad!: number;
}

export class UpdateCartItemDto {
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad!: number;
}

export class CartItemSyncDto {
  @IsInt({ message: 'El ID de la variante debe ser un número entero' })
  id_producto_variante!: number;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  cantidad!: number;
}

export class SyncCartDto {
  @IsArray({ message: 'Los ítems a sincronizar deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => CartItemSyncDto)
  items!: CartItemSyncDto[];
}
