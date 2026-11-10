/**
 * @file main.ts
 * @description Punto de entrada principal (Bootstrap) de la aplicación NestJS Backend.
 * Optimizado para despliegue en Microsoft Azure (App Service / Containers) y ejecución local.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permitir payloads de backup grandes (hasta 50mb)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Middleware para normalizar prefijo /api: permite que las solicitudes funcionen
  // tanto si el cliente apunta a '/api/recurso' como a '/recurso'.
  app.use((req: any, _res: any, next: () => void) => {
    if (req.url.startsWith('/api/')) {
      req.url = req.url.replace(/^\/api/, '');
    } else if (req.url === '/api') {
      req.url = '/';
    }
    next();
  });

  // Habilitar CORS para frontend web (Vite en Azure SWA) y aplicación móvil (Expo / React Native)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Pipe global de validación e inferencia de tipos para DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Dressly Store API running on http://localhost:${port}`);
}

bootstrap();