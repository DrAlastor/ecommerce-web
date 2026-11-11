import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import { tenantStorage } from './tenant-context.js';
import { planAllowsFunction } from './plan-access.js';
import { validate } from 'class-validator';
import { UpdateAppearanceDto } from '../../modules/users-security/use-cases/CU08-personalizar-apariencia/dto/appearance.dto.js';
vi.mock('node:fs', async importOriginal => ({...await importOriginal<typeof import('node:fs')>(), readFileSync: vi.fn()}));

afterEach(() => vi.restoreAllMocks());
describe('Restricciones por plan y edición de apariencia', () => {
  for (const [code, ia, ml] of [['BASICO',false,false], ['PREMIUM',true,false], ['CORPORATIVO',true,true]] as const) {
    it(`aplica capacidades de ${code} sin depender del rol`, () => {
      vi.mocked(fs.readFileSync).mockImplementation(((file: unknown) => String(file).includes('tenants_company')
        ? JSON.stringify({ tienda: {plan_id: code} })
        : JSON.stringify([{codigo:code, activo:true, permite_ia_reportes:ia, permite_ml_analytics:ml}])) as any);
      tenantStorage.run({tenantId:'tienda'}, () => {
        expect(planAllowsFunction('Gestionar productos')).toBe(true);
        expect(planAllowsFunction('Gestionar reportes por voz')).toBe(ia);
        expect(planAllowsFunction('Decisiones & Machine Learning')).toBe(ml);
      });
    });
  }
  it('acepta título pero rechaza metadatos generados por servidor', async () => {
    const dto = Object.assign(new UpdateAppearanceDto(), {site_title:'Mi tienda'});
    expect(await validate(dto, {whitelist:true, forbidNonWhitelisted:true})).toHaveLength(0);
    Object.assign(dto, {fecha_modificacion:'2026-11-11', css_variables:'arbitrario'});
    expect((await validate(dto, {whitelist:true, forbidNonWhitelisted:true})).map(e=>e.property).sort()).toEqual(['css_variables','fecha_modificacion']);
  });
});
