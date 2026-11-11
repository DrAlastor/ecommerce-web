import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../prisma/prisma.service.js';

/** Almacena la apariencia en el archivo heredado o en la base central tras la migración. */
@Injectable()
export class AppearanceStorageService {
  private readonly file = path.resolve(process.cwd(), 'data', 'tenants_appearance.json');
  private readonly postgres = process.env.APPEARANCE_STORAGE === 'postgres';

  constructor(private readonly prisma: PrismaService) {
    if (process.env.APPEARANCE_STORAGE && !['file', 'postgres'].includes(process.env.APPEARANCE_STORAGE)) {
      throw new Error('APPEARANCE_STORAGE debe ser file o postgres');
    }
  }

  private readFile(): Record<string, any> {
    if (!fs.existsSync(this.file)) return {};
    const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Archivo de apariencias inválido');
    return data;
  }

  private writeFile(data: Record<string, any>): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(temporary, this.file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }

  private central() {
    return this.prisma.getClientForTenant('dressly');
  }

  async get(key: string): Promise<any | null> {
    if (!this.postgres) return this.readFile()[key] ?? null;
    const rows = await this.central().$queryRawUnsafe<Array<{ data: any }>>(
      'SELECT data FROM saas_tenant_appearance WHERE tenant_key = $1', key,
    );
    return rows[0]?.data ?? null;
  }

  async put(key: string, data: unknown, onlyIfAbsent = false): Promise<void> {
    if (!this.postgres) {
      const all = this.readFile();
      if (!onlyIfAbsent || !Object.hasOwn(all, key)) {
        all[key] = data;
        this.writeFile(all);
      }
      return;
    }
    const conflict = onlyIfAbsent ? 'DO NOTHING' : 'DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()';
    await this.central().$executeRawUnsafe(
      `INSERT INTO saas_tenant_appearance (tenant_key, data) VALUES ($1, $2::jsonb) ON CONFLICT (tenant_key) ${conflict}`,
      key, JSON.stringify(data),
    );
  }

}
