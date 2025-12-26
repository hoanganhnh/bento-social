import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { RedisClient, RabbitMQClient } from "@bento/shared";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    credentials: true,
  });

  const redisUrl =
    process.env.REDIS_URL || "redis://:bento_redis@localhost:6379/0";
  await RedisClient.init(redisUrl);

  const rabbitmqUrl =
    process.env.RABBITMQ_URL || "amqp://bento:bento_rabbit@localhost:5672";
  await RabbitMQClient.getInstance().connect(rabbitmqUrl);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);

  Logger.log(
    `📝 Post Service is running on: http://localhost:${port}`,
    "Bootstrap",
  );
}

bootstrap();
