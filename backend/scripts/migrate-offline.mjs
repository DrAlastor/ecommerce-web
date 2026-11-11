import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { config } from 'dotenv';
import pg from 'pg';

// Validación por defecto. --apply exige un respaldo pg_dump verificable antes del DDL.
const args = process.argv.slice(2);
const option = name => args.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const envFile = path.resolve(option('env') || '.env');
await fs.access(envFile);
const loaded = config({ path: envFile, quiet: true });
const configuredUrl = loaded.parsed?.DATABASE_URL;
if (!configuredUrl) throw new Error('Falta DATABASE_URL en el archivo de configuración seleccionado');
let base;
try { base = new URL(configuredUrl); } catch { throw new Error('DATABASE_URL no tiene un formato válido; no se muestran credenciales'); }
const names = (option('databases') || '').split(',').filter(Boolean);
if (!names.length || new Set(names).size !== names.length || names.some(name => !/^[a-z][a-z0-9_]*_db$/.test(name) || name === 'saas_db')) throw new Error('Indica explícitamente las bases tenant con --databases=dressly_db,...');
const apply = args.includes('--apply');
const sql = await fs.readFile(new URL('../prisma/offline-schema.sql', import.meta.url), 'utf8');
const ddl = sql.replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '');
const checksum = createHash('sha256').update(sql).digest('hex');
const expected = {
  offline_cash_session: ['id', 'user_id', 'branch_id', 'terminal', 'initial_minor', 'opened_at', 'closed_at', 'counted_minor', 'expected_minor', 'difference_minor', 'closing_manifest', 'closed_by', 'closing_note'],
  offline_preparation: ['id', 'user_id', 'branch_id', 'terminal', 'created_at', 'expires_at', 'catalog', 'session_id'],
  offline_operation: ['id', 'preparation_id', 'user_id', 'payload_hash', 'payload', 'response', 'created_at'],
  offline_resolution: ['id', 'operation_id', 'user_id', 'action', 'note', 'before_response', 'after_response', 'created_at'],
};

function run(binary, argv, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, argv, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let diagnostic = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk).slice(-4000); });
    child.once('error', () => reject(new Error(`No se pudo ejecutar ${path.basename(binary)}`)));
    child.once('close', code => {
      const safe = diagnostic.replaceAll(configuredUrl, '[conexión omitida]').replaceAll(decodeURIComponent(base.password), '[secreto omitido]').slice(0, 700);
      if (code === 0) resolve(output);
      else reject(new Error(`${path.basename(binary)} falló con código ${code}: ${safe}`));
    });
  });
}

async function verify(client) {
  const { rows } = await client.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1::text[])", [Object.keys(expected)]);
  for (const [table, columns] of Object.entries(expected)) {
    if (columns.some(column => !rows.some(row => row.table_name === table && row.column_name === column))) throw new Error(`Estructura offline incompleta: ${table}`);
  }
  for (const row of rows) {
    if (['id', 'preparation_id', 'operation_id', 'session_id'].includes(row.column_name) && row.data_type !== 'uuid') throw new Error(`Tipo UUID incorrecto: ${row.table_name}.${row.column_name}`);
    if (['catalog', 'payload', 'response', 'closing_manifest', 'before_response', 'after_response'].includes(row.column_name) && row.data_type !== 'jsonb') throw new Error(`Tipo JSON incorrecto: ${row.table_name}.${row.column_name}`);
  }
  const constraints = await client.query("SELECT table_name, count(*)::integer AS total FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='FOREIGN KEY' AND table_name = ANY($1::text[]) GROUP BY table_name", [Object.keys(expected)]);
  for (const [table, total] of Object.entries({ offline_cash_session: 3, offline_preparation: 3, offline_operation: 2, offline_resolution: 2 })) {
    if (!constraints.rows.some(row => row.table_name === table && row.total >= total)) throw new Error(`Relaciones offline incompletas: ${table}`);
  }
  const indexes = await client.query("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname = ANY($1::text[])", [['offline_cash_one_open_branch', 'offline_operation_user']]);
  if (indexes.rowCount !== 2) throw new Error('Faltan índices offline');
}

const clients = [];
const report = { createdAt: new Date().toISOString(), host: base.hostname, migrationSha256: checksum, databases: [] };
try {
  for (const name of names) {
    const url = new URL(base); url.pathname = `/${name}`;
    let client;
    for (let attempt = 1; attempt <= 3; attempt++) {
      client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 30000 });
      try { await client.connect(); break; }
      catch (error) {
        await client.end().catch(() => {});
        if (attempt === 3) throw error;
        console.log(JSON.stringify({ database: name, reconnectAttempt: attempt + 1 }));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    clients.push({ name, client, url });
    const { rows } = await client.query("SELECT current_database() AS database, to_regclass('public.usuario')::text AS users, to_regclass('public.sucursal')::text AS branches, has_schema_privilege(current_user, 'public', 'CREATE') AS can_create");
    if (rows[0].database !== name || !rows[0].users || !rows[0].branches || !rows[0].can_create) throw new Error(`La base ${name} no tiene el esquema o permisos esperados`);
    await client.query("SET lock_timeout = '5s'");
    await client.query("SET statement_timeout = '60s'");
    if (args.includes('--verify') && !apply) await verify(client);
    console.log(JSON.stringify({ database: name, host: base.hostname, validated: true, apply }));
  }
  if (apply) {
    const backupDir = option('backup-dir');
    const dump = option('pg-dump');
    if (!backupDir || !dump) throw new Error('--apply requiere --backup-dir y --pg-dump; no se modificó ninguna base');
    const absoluteBackup = path.resolve(backupDir);
    await fs.mkdir(absoluteBackup, { recursive: true, mode: 0o700 });
    await fs.chmod(absoluteBackup, 0o700);
    const restore = path.join(path.dirname(path.resolve(dump)), 'pg_restore');
    await run(dump, ['--version']); await run(restore, ['--version']);
    // Todos los respaldos deben completarse antes de modificar la primera base.
    for (const { name, client, url } of clients) {
      await client.query("SELECT pg_advisory_lock(hashtextextended('dressly-offline-schema-v1', 0))");
      const backup = path.join(absoluteBackup, `${name}-${Date.now()}.dump`);
      const env = { PGHOST: url.hostname, PGPORT: url.port || '5432', PGDATABASE: name, PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get('sslmode') || 'prefer', PGCONNECT_TIMEOUT: '30' };
      await run(dump, ['--format=custom', '--no-password', '--file', backup], env);
      await fs.chmod(backup, 0o600);
      await run(restore, ['--list', backup]);
      const content = await fs.readFile(backup);
      if (!content.length) throw new Error(`Respaldo vacío: ${name}`);
      report.databases.push({ name, backup, backupSha256: createHash('sha256').update(content).digest('hex'), applied: false });
      console.log(JSON.stringify({ database: name, backupVerified: true }));
    }
    for (const { name, client } of clients) {
      await client.query('BEGIN');
      try {
        await client.query(ddl);
        await verify(client);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      report.databases.find(entry => entry.name === name).applied = true;
      await fs.writeFile(path.join(absoluteBackup, 'offline-migration-report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
      console.log(JSON.stringify({ database: name, migrationApplied: true, verified: true }));
    }
  } else {
    console.log('Validación terminada. Sin --apply no se ejecuta DDL ni se modifican datos.');
  }
} catch (error) {
  console.error(JSON.stringify({ success: false, code: error.code || 'MIGRATION_ERROR', message: error.code ? 'Falló la conexión, permisos o ejecución SQL. No se muestran credenciales.' : error.message, applied: report.databases.filter(entry => entry.applied).map(entry => entry.name) }));
  process.exitCode = 1;
} finally {
  await Promise.allSettled(clients.map(async ({ client }) => { await client.query('SELECT pg_advisory_unlock_all()').catch(() => {}); await client.end(); }));
}
