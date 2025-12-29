import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { RedisClient, RabbitMQClient } from "@bento/shared";
import { join } from "path";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    credentials: true,
  });

  // Initialize Redis for event handling
  const redisUrl =
    process.env.REDIS_URL || "redis://:bento_redis@localhost:6379/0";
  await RedisClient.init(redisUrl);

  const rabbitmqUrl =
    process.env.RABBITMQ_URL || "amqp://bento:bento_rabbit@localhost:5672";
  await RabbitMQClient.getInstance().connect(rabbitmqUrl);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "topic",
      protoPath: join(
        __dirname,
        "../../../packages/shared/src/proto/topic.proto",
      ),
      url: "0.0.0.0:50053",
    },
  });

  const port = process.env.PORT ?? 3004;
  await app.startAllMicroservices();
  Logger.log("🔌 gRPC server is running on: 0.0.0.0:50053", "Bootstrap");

  await app.listen(port);

  Logger.log(
    `📁 Topic Service is running on: http://localhost:${port}`,
    "Bootstrap",
  );
}

bootstrap();
