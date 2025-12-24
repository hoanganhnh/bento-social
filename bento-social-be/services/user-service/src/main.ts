import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3003',
    ],
    credentials: true,
  });
  await app.listen(3002);
  console.log('User Service is running on http://localhost:3002');
}
bootstrap();
