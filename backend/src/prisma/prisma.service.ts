/**
 * @file prisma.service.ts
 * @description Servicio de acceso a datos que extiende PrismaClient.
 * Gestiona el ciclo de vida del pool de conexiones PostgreSQL (conexión al iniciar y desconexión limpia al finalizar el ciclo de vida de NestJS).
 */

import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    /**
     * Inicializa la instancia de PrismaClient configurando el adaptador PostgreSQL
     * con la cadena de conexión obtenida de las variables de entorno.
     *
     * @param {ConfigService} configService - Servicio de configuración de NestJS para acceder a DATABASE_URL.
     */
    constructor(configService: ConfigService) {
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

        const adapter = new PrismaPg({
            connectionString: databaseUrl,
        });

        super({ adapter });
    }

    /**
     * Hook de inicialización del módulo NestJS.
     * Abre y establece la conexión con la base de datos PostgreSQL de forma asíncrona.
     *
     * @returns {Promise<void>}
     */
    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    /**
     * Hook de destrucción del módulo NestJS.
     * Cierra de manera ordenada y segura todas las conexiones activas en el pool de Prisma.
     *
     * @returns {Promise<void>}
     */
    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}