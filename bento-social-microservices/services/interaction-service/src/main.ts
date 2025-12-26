import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { RedisClient } from "@bento/shared";
import { join } from "path";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "interaction",
      protoPath: join(
        __dirname,
        "../../../packages/shared/src/proto/interaction.proto",
      ),
      url: "0.0.0.0:50054",
    },
  });

  app.enableCors({
    origin: "*",
    credentials: true,
  });

  const redisUrl =
    process.env.REDIS_URL || "redis://:bento_redis@localhost:6379/0";
  await RedisClient.init(redisUrl);

  const port = process.env.PORT ?? 3008;

  // Start gRPC microservice
  await app.startAllMicroservices();
  Logger.log("🔌 gRPC server is running on: 0.0.0.0:50054", "Bootstrap");

  // Start HTTP server
  await app.listen(port);
  Logger.log(
    `🤝 Interaction Service is running on: http://localhost:${port}`,
    "Bootstrap",
  );
}

bootstrap();
