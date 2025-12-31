import { Module } from "@nestjs/common";

import { ConfigModule } from "./config/config.module";
import { HealthModule } from "./health/health.module";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    ProxyModule, // Proxy controller for routing to microservices
  ],
})
export class AppModule {}
