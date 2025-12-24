import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  Logger.log(`🚀 API Gateway is running on: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📡 Proxying requests to microservices...`, 'Bootstrap');
}

bootstrap();

