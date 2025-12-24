import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  Logger.log(`🔐 Auth Service is running on: http://localhost:${port}`, 'Bootstrap');
}

bootstrap();

