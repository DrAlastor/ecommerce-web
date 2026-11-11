import { describe, it, expect, vi } from 'vitest';
import { OfflineController } from './offline.controller.js';

const id = '0cbd289b-923f-4dbb-86f8-72e2fbd1bdb1';
const preparationId = '87325bc9-190a-44eb-ac61-0cd8b6a61fcb';
const request = { user: { id_usuario: 7, id_rol: 1, rol: 'Administrador' } };
const body = { id, preparationId, createdAt: '2026-11-11T12:00:00Z', receivedMinor: 2000, items: [{ variant: 1, quantity: 1, priceMinor: 2000 }] };

function setup() {
  const tx = { $executeRaw: vi.fn().mockResolvedValue(1), $executeRawUnsafe: vi.fn().mockResolvedValue(1), $queryRaw: vi.fn() };
  const prisma = { $transaction: vi.fn((fn: any) => fn(tx)), empleado_sucursal: { findFirst: vi.fn() } };
  const pos = { registerPresentialSale: vi.fn(), getCashierBranches: vi.fn(), getPOSProducts: vi.fn() };
  return { tx, prisma, pos, controller: new OfflineController(prisma as any, pos as any) };
}

describe('Contrato offline v1', () => {
  it('descarga automáticamente el catálogo sin abrir una caja ni fijar dinero', async () => {
    const { controller, prisma, pos } = setup();
    pos.getCashierBranches.mockResolvedValue([{ id_sucursal: 1 }]);
    pos.getPOSProducts.mockResolvedValue([]);
    const result = await controller.catalog(request, '1', 'test');
    expect(result.catalogOnly).toBe(true);
    expect(result.sessionId).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('conserva una venta cobrada cuando el stock central impide aplicarla', async () => {
    const { tx, pos, controller } = setup();
    tx.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ branch_id: 1, created_at: '2026-11-11T11:00:00Z', expires_at: '2026-11-11T19:00:00Z', catalog: [{ variantes: [{ id_producto_variante: 1, precio_final: 20 }] }] }]);
    pos.registerPresentialSale.mockRejectedValue(new Error('stock'));
    const response = await controller.sync(request, body);
    expect(response.status).toBe('REVIEW');
    expect(tx.$executeRawUnsafe).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT offline_sale');
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it('no vuelve a ejecutar una venta cuyo resultado ya existe', async () => {
    const { tx, pos, controller } = setup();
    // Obtener el hash insertado por el primer envío sin depender de su implementación.
    tx.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ branch_id: 1, created_at: '2026-11-11T11:00:00Z', expires_at: '2026-11-11T19:00:00Z', catalog: [] }]);
    const first = await controller.sync(request, body);
    const insert = tx.$executeRaw.mock.calls[1];
    const hash = insert[4];
    tx.$queryRaw.mockResolvedValueOnce([{ user_id: 7, payload_hash: hash, response: first }]);
    expect(await controller.sync(request, body)).toEqual(first);
    expect(pos.registerPresentialSale).not.toHaveBeenCalled();
  });

  it('rechaza reutilización de UUID con contenido diferente', async () => {
    const { tx, controller } = setup();
    tx.$queryRaw.mockResolvedValueOnce([{ user_id: 7, payload_hash: 'different', response: {} }]);
    await expect(controller.sync(request, body)).rejects.toThrow('otro contenido');
  });

  it('rechaza importes manipulados antes de ejecutar una venta', async () => {
    const { pos, controller } = setup();
    await expect(controller.sync(request, { ...body, items: [{ variant: 1, quantity: -1, priceMinor: 100 }] })).rejects.toThrow('Detalle inválido');
    expect(pos.registerPresentialSale).not.toHaveBeenCalled();
  });

  it('no prepara una sucursal sin asignación explícita para un empleado', async () => {
    const { controller, prisma } = setup();
    prisma.empleado_sucursal.findFirst.mockResolvedValue(null);
    await expect(controller.prepare({ user: { id_usuario: 7, id_rol: 2, rol: 'Cajero' } }, { branch: 3, terminal: 'test' })).rejects.toThrow('asignación explícita');
  });
});
