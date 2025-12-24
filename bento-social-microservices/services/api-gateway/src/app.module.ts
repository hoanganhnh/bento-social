import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ConfigModule } from './config/config.module';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';

@Module({
	imports: [ConfigModule, HttpModule, ProxyModule, HealthModule],
})
export class AppModule {}
