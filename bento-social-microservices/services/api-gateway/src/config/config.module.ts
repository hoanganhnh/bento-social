import { Global, Module } from '@nestjs/common';
import { ServicesConfig, SERVICES_CONFIG } from './services.config';

@Global()
@Module({
  providers: [
    {
      provide: SERVICES_CONFIG,
      useValue: ServicesConfig,
    },
  ],
  exports: [SERVICES_CONFIG],
})
export class ConfigModule {}

