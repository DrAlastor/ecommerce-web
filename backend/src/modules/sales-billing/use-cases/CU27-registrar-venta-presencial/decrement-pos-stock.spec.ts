import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { decrementPosStock } from './decrement-pos-stock.js';

describe('decrementPosStock', () => {
  it('condiciona el descuento a que haya existencias suficientes', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    await decrementPosStock({ updateMany }, 42, 3);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id_inventario_sucursal: 42, stock_disponible: { gte: 3 } },
      data: { stock_disponible: { decrement: 3 }, ultima_actualizacion: expect.any(Date) },
    });
  });

  it('rechaza la venta si otra operación consumió el stock', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    await expect(decrementPosStock({ updateMany }, 42, 3)).rejects.toBeInstanceOf(BadRequestException);
  });
});
