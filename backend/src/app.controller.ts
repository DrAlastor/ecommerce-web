import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

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