import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';
import { SERVICES_CONFIG, IServicesConfig } from '../config/services.config';

export interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(SERVICES_CONFIG) private readonly servicesConfig: IServicesConfig,
  ) {}

  async checkService(name: string, url: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${url}/health`).pipe(
          timeout(5000),
          catchError((error) => {
            return of({ status: 500, data: null, error });
          }),
        ),
      );

      const latency = Date.now() - startTime;

      if (response.status >= 200 && response.status < 300) {
        return {
          status: 'up',
          latency,
        };
      }

      return {
        status: 'down',
        latency,
        error: `HTTP ${response.status}`,
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.logger.warn(`Health check failed for ${name}: ${error.message}`);
      
      return {
        status: 'down',
        latency,
        error: error.message,
      };
    }
  }

  async checkAllServices(): Promise<Record<string, ServiceHealth>> {
    const services: Record<string, ServiceHealth> = {};

    const checks = Object.entries(this.servicesConfig).map(
      async ([name, url]) => {
        services[name.toLowerCase()] = await this.checkService(name, url);
      },
    );

    await Promise.all(checks);

    return services;
  }
}

