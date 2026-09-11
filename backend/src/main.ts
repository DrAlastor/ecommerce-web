import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permitir solicitudes tanto con prefijo /api como sin él
  app.use((req: any, _res: any, next: () => void) => {
    if (req.url.startsWith('/api/')) {
      req.url = req.url.replace(/^\/api/, '');
    } else if (req.url === '/api') {
      req.url = '/';
    }
    next();
  });

  // Habilitar CORS para frontend web y móvil
  app.enableCors({
    origin: true,
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