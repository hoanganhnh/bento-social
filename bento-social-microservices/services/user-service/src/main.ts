import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(
        __dirname,
        '../../../packages/shared/src/proto/user.proto',
      ),
      url: '0.0.0.0:50051',
    },
  });

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.PORT ?? 3002;

  // Start all microservices (gRPC)
  await app.startAllMicroservices();
  Logger.log('🔌 gRPC server is running on: 0.0.0.0:50051', 'Bootstrap');

  // Start HTTP server
  await app.listen(port);
  Logger.log(
    `👤 User Service is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap();
