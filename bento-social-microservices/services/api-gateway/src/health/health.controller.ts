import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService, ServiceHealth } from './health.service';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services?: Record<string, ServiceHealth>;
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('services')
  @HttpCode(HttpStatus.OK)
  async checkServices(): Promise<HealthResponse> {
    const services = await this.healthService.checkAllServices();
    
    const allHealthy = Object.values(services).every((s) => s.status === 'up');
    const allUnhealthy = Object.values(services).every((s) => s.status === 'down');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (allUnhealthy) {
      status = 'unhealthy';
    } else if (!allHealthy) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services,
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  ready(): { ready: boolean } {
    return { ready: true };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  live(): { live: boolean } {
    return { live: true };
  }
}

