import * as fs from 'node:fs';
import * as path from 'node:path';
import { getTenantId } from './tenant-context.js';

export function tenantCapabilities() {
  const companies = JSON.parse(fs.readFileSync(path.resolve('data/tenants_company.json'), 'utf8'));
  const plans = JSON.parse(fs.readFileSync(path.resolve('data/saas_plans.json'), 'utf8'));
  // SaaS administra los cambios de plan en estos metadatos. Las empresas
  // recién registradas pueden tener únicamente el plan inicial en company.
  let metadata: Record<string, { planId?: string }> = {};
  try {
    metadata = JSON.parse(fs.readFileSync(path.resolve('data/tenants_saas_meta.json'), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const tenant = getTenantId();
  const raw = (metadata[tenant]?.planId || companies[tenant]?.plan_id || 'PRUEBA').trim();
  const aliases: Record<string,string> = {trial:'PRUEBA', 'plan-basic':'BASICO', 'plan-enterprise':'PREMIUM', 'plan-corporate':'CORPORATIVO', 'plan-unlimited':'EMPRESARIAL'};
  const code = aliases[raw.toLowerCase()] || raw.toUpperCase();
  const plan = plans.find((p: any) => p.codigo === code && p.activo);
  return { ia: Boolean(plan?.permite_ia_reportes), ml: Boolean(plan?.permite_ml_analytics) };
}

export function planAllowsFunction(name: string): boolean {
  const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const caps = tenantCapabilities();
  if (/machine|\bml\b|decision|predic|cluster|scenario|neuronal/.test(n)) return caps.ml;
  if (/\bia\b|\bqbe\b|voz|inteligencia artificial/.test(n)) return caps.ia;
  return true;
}
