import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "auth",
      protoPath: join(
        __dirname,
        "../../../packages/shared/src/proto/auth.proto",
      ),
      url: "0.0.0.0:50052",
    },
  });

  app.enableCors({
    origin: "*",
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;

  await app.startAllMicroservices();
  Logger.log("🔌 gRPC server is running on: 0.0.0.0:50052", "Bootstrap");

  await app.listen(port);
  Logger.log(
    `🔐 Auth Service is running on: http://localhost:${port}`,
    "Bootstrap",
  );
}

bootstrap();

