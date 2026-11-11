import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const destination = process.argv[2];
if (!destination) throw new Error('Uso: node scripts/export-appearance.mjs /ruta/archivo-nuevo.json');
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL de la base central');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query('SELECT tenant_key, data FROM saas_tenant_appearance ORDER BY tenant_key');
  const output = Object.fromEntries(rows.map(({ tenant_key, data }) => [tenant_key, data]));
  fs.writeFileSync(path.resolve(destination), JSON.stringify(output, null, 2), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  console.log(`Exportadas ${rows.length} apariencias. El archivo existente no se sobrescribe.`);
} finally {
  await client.end();
}
