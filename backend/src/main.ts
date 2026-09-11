import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para frontend web y móvil
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3001', // Alternativo
      process.env.FRONTEND_URL, // Azure Static Web Apps (producción)
    ].filter(Boolean),
    credentials: true,
  });

  // Pipe global de validación para DTOs (class-validator)
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

await bootstrap();