import { BadRequestException } from '@nestjs/common';

/** Decrementa solo si todavía hay existencias; debe ejecutarse dentro de la transacción de venta. */
export async function decrementPosStock(
  inventory: {
    updateMany(args: {
      where: { id_inventario_sucursal: number; stock_disponible: { gte: number } };
      data: { stock_disponible: { decrement: number }; ultima_actualizacion: Date };
    }): Promise<{ count: number }>;
  },
  inventoryId: number,
  quantity: number,
): Promise<void> {
  const result = await inventory.updateMany({
    where: { id_inventario_sucursal: inventoryId, stock_disponible: { gte: quantity } },
    data: { stock_disponible: { decrement: quantity }, ultima_actualizacion: new Date() },
  });
  if (result.count !== 1) {
    throw new BadRequestException('Las existencias cambiaron. Actualiza el catálogo y revisa la venta.');
  }
}
