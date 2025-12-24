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

  const redisUrl = process.env.REDIS_URL || 'redis://:bento_redis@localhost:6379/0';
  await RedisClient.init(redisUrl);

  const port = process.env.PORT ?? 3006;
  await app.listen(port);

  Logger.log(
    `🔔 Notification Service is running on: http://localhost:${port}`,
    'Bootstrap'
  );
}

bootstrap();

