import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [PrismaModule, HealthModule, NotificationModule],
})
export class AppModule {}

