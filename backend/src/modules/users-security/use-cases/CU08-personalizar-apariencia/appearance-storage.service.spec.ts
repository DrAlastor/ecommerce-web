import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppearanceStorageService } from './appearance-storage.service.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const previousMode = process.env.APPEARANCE_STORAGE;
afterEach(() => {
  vi.restoreAllMocks();
  if (previousMode === undefined) delete process.env.APPEARANCE_STORAGE;
  else process.env.APPEARANCE_STORAGE = previousMode;
});

describe('almacenamiento de apariencia en archivo', () => {
  it('conserva las otras tiendas y no sustituye una apariencia existente', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'appearance-test-'));
    try {
      process.env.APPEARANCE_STORAGE = 'file';
      vi.spyOn(process, 'cwd').mockReturnValue(directory);
      const storage = new AppearanceStorageService({} as any);
      await storage.put('dressly', { nombre: 'Dressly' });
      await storage.put('urbanly', { nombre: 'Urbanly' });
      await storage.put('dressly', { nombre: 'No reemplazar' }, true);
      expect(await storage.get('dressly')).toEqual({ nombre: 'Dressly' });
      expect(await storage.get('urbanly')).toEqual({ nombre: 'Urbanly' });
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('almacenamiento de apariencia en PostgreSQL', () => {
  it('consulta la tienda solicitada en la base central y no devuelve otra', async () => {
    process.env.APPEARANCE_STORAGE = 'postgres';
    const query = vi.fn().mockResolvedValue([]);
    const central = { $queryRawUnsafe: query };
    const prisma = { getClientForTenant: vi.fn().mockReturnValue(central) };
    const storage = new AppearanceStorageService(prisma as any);
    expect(await storage.get('otra-tienda')).toBeNull();
    expect(prisma.getClientForTenant).toHaveBeenCalledWith('dressly');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('tenant_key = $1'), 'otra-tienda');
  });

  it('crea sin sobrescribir y usa parámetros para el identificador y los datos', async () => {
    process.env.APPEARANCE_STORAGE = 'postgres';
    const execute = vi.fn().mockResolvedValue(1);
    const storage = new AppearanceStorageService({ getClientForTenant: () => ({ $executeRawUnsafe: execute }) } as any);
    await storage.put('urbanly', { codigo_empresa: 'urbanly', tagline: 'Mi tienda' }, true);
    expect(execute).toHaveBeenCalledWith(expect.stringContaining('DO NOTHING'), 'urbanly', JSON.stringify({ codigo_empresa: 'urbanly', tagline: 'Mi tienda' }));
  });
});
