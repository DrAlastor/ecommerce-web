import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

// Sin --apply solo valida el archivo; no abre conexiones ni modifica datos.
const file = path.resolve(process.argv.find(arg => arg.startsWith('--file='))?.slice(7) || 'data/tenants_appearance.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('El archivo de apariencias no es un objeto válido');
const entries = Object.entries(data);
for (const [key, value] of entries) {
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(key) || !value || typeof value !== 'object' || Array.isArray(value) || value.codigo_empresa !== key) {
    throw new Error(`Apariencia inválida para ${key}`);
  }
}
if (!process.argv.includes('--apply')) {
  console.log(`Validación correcta: ${entries.length} apariencias. No se modificó ninguna base de datos.`);
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL de la base central');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(`CREATE TABLE IF NOT EXISTS saas_tenant_appearance (
    tenant_key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  let inserted = 0;
  for (const [key, value] of entries) {
    const result = await client.query(
      'INSERT INTO saas_tenant_appearance (tenant_key, data) VALUES ($1, $2::jsonb) ON CONFLICT (tenant_key) DO NOTHING',
      [key, JSON.stringify(value)],
    );
    inserted += result.rowCount ?? 0;
    if (!result.rowCount) {
      const existing = await client.query(
        'SELECT data IS NOT DISTINCT FROM $2::jsonb AS matches FROM saas_tenant_appearance WHERE tenant_key = $1',
        [key, JSON.stringify(value)],
      );
      if (!existing.rows[0]?.matches) throw new Error(`La apariencia existente de ${key} difiere del archivo; no se modificó la base`);
    }
  }
  await client.query('COMMIT');
  console.log(`Migración completada: ${inserted} insertadas, ${entries.length - inserted} ya existían con los mismos datos.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
