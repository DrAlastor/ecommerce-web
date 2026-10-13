/**
 * @file main.ts
 * @description Punto de entrada principal (Bootstrap) de la aplicación NestJS Backend.
 * Soporta ejecución como servidor HTTP tradicional en local y como Serverless Function en Vercel.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module.js';

let cachedServer: any;

async function bootstrapServer(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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

  // Habilitar CORS para frontend web (Vite) y aplicación móvil (React Native / Expo)
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

  await app.init();
  cachedServer = expressApp;
  return cachedServer;
}

// Export predeterminado y con nombre requerido por Vercel Serverless Functions
export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}
export { handler };

// Ejecución local (cuando no está en entorno Vercel Serverless)
if (!process.env.VERCEL) {
  const server = await bootstrapServer();
  const port = process.env.PORT ?? 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Dressly Store API running on http://localhost:${port}`);
  });
}