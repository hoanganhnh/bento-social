import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.PORT ?? 3007;
  await app.listen(port);

  Logger.log(
    `📁 Upload Service is running on: http://localhost:${port}`,
    'Bootstrap'
  );
}

bootstrap();

