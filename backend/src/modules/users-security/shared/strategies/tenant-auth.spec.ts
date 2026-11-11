import { describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { runWithTenant } from '../../../../common/tenant/tenant-context.js';
import { LoginService } from '../../use-cases/CU01-gestionar-acceso/login.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('aislamiento de autenticación por tienda', () => {
  it('rechaza contraseñas conocidas que no coinciden con el hash', async () => {
    const hash = await bcrypt.hash('una-clave-distinta', 4);
    const prisma = { usuario: { findUnique: vi.fn().mockResolvedValue({ id_usuario: 1, estado: 'activo', password_hash: hash }) } };
    const service = new LoginService(prisma as any, {} as any, {} as any, {} as any);
    await expect(service.validateUser('admin@example.com', 'Admin123*')).rejects.toThrow('Credenciales inválidas');
  });

  it('rechaza tokens de otra tienda antes de consultar usuarios', async () => {
    const findUnique = vi.fn();
    const strategy = new JwtStrategy({ getOrThrow: () => 'test-secret' } as any, { usuario: { findUnique } } as any);
    await expect(runWithTenant('urbanly', () => strategy.validate({ sub: 1, email: 'a@example.com', rol: 'Administrador', id_rol: 1, tenant: 'dressly' }))).rejects.toThrow();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('acepta una sesión activa de la tienda correcta', async () => {
    const usuario = { estado: 'activo', email: 'a@example.com', id_rol: 1 };
    const strategy = new JwtStrategy({ getOrThrow: () => 'test-secret' } as any, { usuario: { findUnique: vi.fn().mockResolvedValue(usuario) } } as any);
    const result = await runWithTenant('urbanly', () => strategy.validate({ sub: 1, email: usuario.email, rol: 'Administrador', id_rol: 1, tenant: 'urbanly' }));
    expect(result.id_usuario).toBe(1);
  });
});
