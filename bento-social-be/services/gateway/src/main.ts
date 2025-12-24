import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3003',
    ],
    credentials: true,
  });
  await app.listen(3000);
  console.log('Gateway is running on http://localhost:3000');
}
bootstrap();
