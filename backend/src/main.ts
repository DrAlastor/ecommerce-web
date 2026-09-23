/**
 * @file main.ts
 * @description Punto de entrada principal (Bootstrap) de la aplicación NestJS Backend.
 * Configura el servidor HTTP, middleware de prefijos de ruta, políticas CORS,
 * tuberías globales de validación y transformación de DTOs, y el puerto de escucha.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

/**
 * Procedimiento de arranque del servidor backend.
 * - Instancia la aplicación mediante NestFactory.
 * - Registra un middleware personalizado para normalizar rutas con o sin prefijo '/api'.
 * - Configura Cross-Origin Resource Sharing (CORS) permitiendo peticiones desde clientes Web y Móvil.
 * - Establece ValidationPipe global con class-validator (whitelist, transformación automática de tipos).
 * - Inicia la escucha de conexiones en el puerto configurado o 3000 por defecto.
 *
 * @returns {Promise<void>} Promesa que resuelve una vez que el servidor se encuentra escuchando peticiones.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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

  // Pipe global de validación e inferencia de tipos para DTOs (Data Transfer Objects)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Descarta propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
      transform: true, // Convierte payloads a instancias de las clases DTO
      transformOptions: {
        enableImplicitConversion: true, // Conversión implícita de tipos primitivos (string -> number, etc.)
      },
    }),
  );

  const port = process.env.PORT ?? 3000;

  // Escuchar en todas las interfaces de red (0.0.0.0) para permitir acceso desde dispositivos en la LAN y emuladores
  await app.listen(port, '0.0.0.0');

  console.log(`Dressly Store API running on http://localhost:${port}`);
}

await bootstrap();