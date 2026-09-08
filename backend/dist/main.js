import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`FashionStore API running on http://localhost:${port}`);
}
await bootstrap();
//# sourceMappingURL=main.js.map