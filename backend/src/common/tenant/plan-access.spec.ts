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

describe('Plan efectivo administrado por SaaS', () => {
  function mockFiles(companies: unknown, metadata: unknown, plans: unknown) {
    vi.mocked(fs.readFileSync).mockImplementation(((file: unknown) => {
      const filename = String(file);
      if (filename.includes('tenants_company')) return JSON.stringify(companies);
      if (filename.includes('tenants_saas_meta')) return JSON.stringify(metadata);
      return JSON.stringify(plans);
    }) as any);
  }

  it('respeta los accesos declarados para las tres empresas existentes', async () => {
    const realFs = await vi.importActual<typeof import('node:fs')>('node:fs');
    const companies = JSON.parse(realFs.readFileSync('data/tenants_company.json', 'utf8'));
    const metadata = JSON.parse(realFs.readFileSync('data/tenants_saas_meta.json', 'utf8'));
    const plans = JSON.parse(realFs.readFileSync('data/saas_plans.json', 'utf8'));
    mockFiles(companies, metadata, plans);
    for (const [tenant, ia, ml] of [['dressly', true, true], ['urbanly', true, false], ['aura-sport', true, true]] as const) {
      tenantStorage.run({ tenantId: tenant }, () => {
        expect(planAllowsFunction('Gestionar reportes qbe')).toBe(ia);
        expect(planAllowsFunction('Gestionar reportes por voz')).toBe(ia);
        expect(planAllowsFunction('Predicciones Machine Learning')).toBe(ml);
      });
    }
  });

  it('aplica una reducción de plan en SaaS aunque company conserve el anterior', () => {
    mockFiles({ tienda: { plan_id: 'EMPRESARIAL' } }, { tienda: { planId: 'BASICO' } }, [
      { codigo: 'BASICO', activo: true, permite_ia_reportes: false, permite_ml_analytics: false },
      { codigo: 'EMPRESARIAL', activo: true, permite_ia_reportes: true, permite_ml_analytics: true },
    ]);
    tenantStorage.run({ tenantId: 'tienda' }, () => {
      expect(planAllowsFunction('Gestionar reportes qbe')).toBe(false);
      expect(planAllowsFunction('Predicciones Machine Learning')).toBe(false);
    });
  });

  it('mantiene el plan inicial de empresas nuevas y restringe empresas desconocidas', () => {
    mockFiles({ nueva: { plan_id: 'plan-enterprise' } }, {}, [
      { codigo: 'PREMIUM', activo: true, permite_ia_reportes: true, permite_ml_analytics: false },
    ]);
    tenantStorage.run({ tenantId: 'nueva' }, () => {
      expect(planAllowsFunction('Gestionar reportes qbe')).toBe(true);
      expect(planAllowsFunction('Predicciones Machine Learning')).toBe(false);
    });
    tenantStorage.run({ tenantId: 'desconocida' }, () => {
      expect(planAllowsFunction('Gestionar reportes qbe')).toBe(false);
    });
  });

  it('no habilita capacidades de un plan inactivo', () => {
    mockFiles({}, { tienda: { planId: 'EMPRESARIAL' } }, [
      { codigo: 'EMPRESARIAL', activo: false, permite_ia_reportes: true, permite_ml_analytics: true },
    ]);
    tenantStorage.run({ tenantId: 'tienda' }, () => {
      expect(planAllowsFunction('Gestionar reportes qbe')).toBe(false);
    });
  });
});
