import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisClient } from '@bento/shared';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Initialize Redis for event handling
  const redisUrl = process.env.REDIS_URL || 'redis://:bento_redis@localhost:6379/0';
  await RedisClient.init(redisUrl);

  const port = process.env.PORT ?? 3004;
  await app.listen(port);

  Logger.log(
    `📁 Topic Service is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap();

