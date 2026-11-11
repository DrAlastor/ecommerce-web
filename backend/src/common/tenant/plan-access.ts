import * as fs from 'node:fs';
import * as path from 'node:path';
import { getTenantId } from './tenant-context.js';

export function tenantCapabilities() {
  const companies = JSON.parse(fs.readFileSync(path.resolve('data/tenants_company.json'), 'utf8'));
  const plans = JSON.parse(fs.readFileSync(path.resolve('data/saas_plans.json'), 'utf8'));
  const raw = companies[getTenantId()]?.plan_id || 'PRUEBA';
  const aliases: Record<string,string> = {trial:'PRUEBA', 'plan-basic':'BASICO', 'plan-enterprise':'PREMIUM', 'plan-corporate':'CORPORATIVO', 'plan-unlimited':'EMPRESARIAL'};
  const code = aliases[raw] || raw.toUpperCase();
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
