import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3003);
  console.log('Post Service is running on http://localhost:3003');
}
bootstrap();
