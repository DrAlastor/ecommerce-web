/**
 * @file prisma.service.ts
 * @description Servicio de acceso a datos multi-tenant que extiende PrismaClient.
 * Implementa enrutamiento dinámico de conexiones mediante Proxy y AsyncLocalStorage.
 * Cada tenant (dressly, urbanly, aura-sport o nuevas empresas) opera en su propia
 * base de datos física aislada en Azure PostgreSQL, garantizando aislamiento total.
 */

import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { getTenantId } from '../common/tenant/tenant-context.js';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly clients = new Map<string, PrismaClient>();
    private readonly baseConnectionUrl: string;
    private readonly defaultSearch: string;

    /**
     * Inicializa la instancia base de PrismaClient y configura el enrutador multi-tenant.
     *
     * @param {ConfigService} configService - Servicio de configuración de NestJS para acceder a DATABASE_URL.
     */
    constructor(private readonly configService: ConfigService) {
        const defaultUrl = configService.getOrThrow<string>('DATABASE_URL');
        const defaultAdapter = new PrismaPg({
            connectionString: defaultUrl,
        });

        super({ adapter: defaultAdapter });

        // Extraer credenciales y host para derivar cadenas de conexión de cada tenant
        const urlObj = new URL(defaultUrl);
        this.baseConnectionUrl = `${urlObj.protocol}//${urlObj.username}:${encodeURIComponent(urlObj.password)}@${urlObj.host}`;
        this.defaultSearch = urlObj.search || '?schema=public';

        // Registrar cliente por defecto (dressly_db)
        this.clients.set('dressly', this);

        // Retornar un Proxy transparente: delega todas las operaciones de modelos de Prisma
        // (producto, usuario, venta, etc.) al PrismaClient conectado a la base de datos del tenant activo.
        const ownProps = new Set([
            'onModuleInit',
            'onModuleDestroy',
            'getClientForTenant',
            'baseConnectionUrl',
            'defaultSearch',
            'logger',
            'clients',
            'configService',
        ]);

        return new Proxy(this, {
            get: (target: PrismaService, prop: string | symbol) => {
                // Solo exponer directamente las propiedades y hooks propios de PrismaService
                if (ownProps.has(prop as string)) {
                    const member = (target as any)[prop];
                    if (typeof member === 'function') {
                        return member.bind(target);
                    }
                    return member;
                }

                // Resolver cliente correspondiente al tenant activo de la petición HTTP
                const tenantId = getTenantId();
                const tenantClient = target.getClientForTenant(tenantId);
                const value = (tenantClient as any)[prop];

                if (typeof value === 'function') {
                    return value.bind(tenantClient);
                }
                return value;
            },
        });
    }

    /**
     * Resuelve o inicializa un pool de conexión PrismaClient para la base de datos del tenant solicitado.
     *
     * @param {string} tenantKey - Identificador del inquilino (ej. dressly, urbanly, aura-sport, o nueva empresa).
     * @returns {PrismaClient}
     */
    getClientForTenant(tenantKey: string): PrismaClient {
        const key = (tenantKey || 'dressly').toLowerCase().trim();
        if (this.clients.has(key)) {
            return this.clients.get(key)!;
        }

        let dbName = 'dressly_db';
        if (key === 'urbanly') {
            dbName = 'urbanly_db';
        } else if (key === 'aura-sport' || key === 'aura') {
            dbName = 'aura_sport_db';
        } else {
            // Nombre derivado para empresas creadas dinámicamente desde el sistema SaaS
            dbName = `${key.replace(/[^a-z0-9_]/g, '_')}_db`;
        }

        const tenantConnString = `${this.baseConnectionUrl}/${dbName}${this.defaultSearch}`;
        try {
            const adapter = new PrismaPg({ connectionString: tenantConnString });
            const client = new PrismaClient({ adapter });
            this.clients.set(key, client);
            return client;
        } catch (err: any) {
            this.logger.warn(`No se pudo inicializar conexión a ${dbName} para ${key}: ${err.message}. Utilizando conexión base.`);
            return this;
        }
    }

    /**
     * Inicialización del módulo NestJS:
     * Conecta el cliente principal y pre-calienta las conexiones de los tenants preconfigurados.
     */
    async onModuleInit(): Promise<void> {
        await this.$connect();
        try {
            await this.getClientForTenant('urbanly').$connect();
            await this.getClientForTenant('aura-sport').$connect();
            this.logger.log('Multi-Tenant Connection Pools inicializados con éxito: [dressly_db, urbanly_db, aura_sport_db]');
        } catch (err: any) {
            this.logger.warn(`Aviso en precalentamiento de conexiones multi-tenant: ${err.message}`);
        }
    }

    /**
     * Destrucción ordenada del módulo NestJS:
     * Cierra todas las conexiones activas en todos los pools de tenants.
     */
    async onModuleDestroy(): Promise<void> {
        for (const [tenant, client] of this.clients.entries()) {
            try {
                if (client !== (this as any)) {
                    await client.$disconnect();
                }
            } catch (err: any) {
                this.logger.warn(`Error al desconectar pool de ${tenant}: ${err.message}`);
            }
        }
        await this.$disconnect();
    }
}
