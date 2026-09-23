/**
 * @file app.controller.ts
 * @description Controlador raíz del Backend.
 * Proporciona endpoints de bienvenida y diagnóstico de conectividad a la base de datos (Health Check).
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Endpoint de bienvenida y verificación de estado operativo básico.
   *
   * @returns {string} Mensaje de saludo informando que el servicio API está en ejecución.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint de diagnóstico (Health Check) de la base de datos.
   * Ejecuta una consulta ligera de conteo sobre la tabla 'ciudad' para verificar
   * que el pool de conexiones Prisma y la base de datos PostgreSQL respondan correctamente.
   *
   * @returns {Promise<{ status: string, database: string, table: string, records: number }>}
   * Objeto con el estado de conectividad, motor de BD y número de registros obtenidos.
   */
  @Get('db-check')
  async dbCheck() {
    const totalCiudades = await this.prisma.ciudad.count();

    return {
      status: 'ok',
      database: 'Azure PostgreSQL',
      table: 'ciudad',
      records: totalCiudades,
    };
  }
}