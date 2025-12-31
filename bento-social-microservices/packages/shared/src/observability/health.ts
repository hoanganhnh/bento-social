/**
 * Health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Individual health check result
 */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latencyMs?: number;
  details?: Record<string, any>;
}

/**
 * Overall health response
 */
export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: HealthCheckResult[];
}

/**
 * Health check function type
 */
export type HealthCheck = () => Promise<HealthCheckResult>;

/**
 * Health checker configuration
 */
export interface HealthCheckerOptions {
  serviceName: string;
  version?: string;
}

/**
 * Health checker class
 */
export class HealthChecker {
  private readonly serviceName: string;
  private readonly version: string;
  private readonly startTime: number;
  private readonly checks: Map<string, HealthCheck> = new Map();

  constructor(options: HealthCheckerOptions) {
    this.serviceName = options.serviceName;
    this.version = options.version || '1.0.0';
    this.startTime = Date.now();
  }

  /**
   * Register a health check
   */
  register(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all health checks
   */
  async check(): Promise<HealthResponse> {
    const results: HealthCheckResult[] = [];
    let overallStatus = HealthStatus.HEALTHY;

    for (const [name, check] of this.checks) {
      try {
        const start = Date.now();
        const result = await check();
        result.latencyMs = Date.now() - start;
        results.push(result);

        // Update overall status
        if (result.status === HealthStatus.UNHEALTHY) {
          overallStatus = HealthStatus.UNHEALTHY;
        } else if (result.status === HealthStatus.DEGRADED && overallStatus !== HealthStatus.UNHEALTHY) {
          overallStatus = HealthStatus.DEGRADED;
        }
      } catch (error: any) {
        results.push({
          name,
          status: HealthStatus.UNHEALTHY,
          message: error.message,
        });
        overallStatus = HealthStatus.UNHEALTHY;
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: results,
    };
  }

  /**
   * Liveness check (is the service running?)
   */
  async liveness(): Promise<{ status: 'ok' | 'error' }> {
    return { status: 'ok' };
  }

  /**
   * Readiness check (is the service ready to accept traffic?)
   */
  async readiness(): Promise<HealthResponse> {
    return this.check();
  }
}

/**
 * Create a health checker instance
 */
export function createHealthChecker(options: HealthCheckerOptions): HealthChecker {
  return new HealthChecker(options);
}

// Common health check factories

/**
 * Create a database health check
 */
export function createDatabaseHealthCheck(
  name: string,
  checkFn: () => Promise<boolean>
): HealthCheck {
  return async (): Promise<HealthCheckResult> => {
    try {
      const isHealthy = await checkFn();
      return {
        name,
        status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        message: isHealthy ? 'Connected' : 'Connection failed',
      };
    } catch (error: any) {
      return {
        name,
        status: HealthStatus.UNHEALTHY,
        message: error.message,
      };
    }
  };
}

/**
 * Create a Redis health check
 */
export function createRedisHealthCheck(
  name: string,
  pingFn: () => Promise<string>
): HealthCheck {
  return async (): Promise<HealthCheckResult> => {
    try {
      const result = await pingFn();
      return {
        name,
        status: result === 'PONG' ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        message: result === 'PONG' ? 'Connected' : `Unexpected response: ${result}`,
      };
    } catch (error: any) {
      return {
        name,
        status: HealthStatus.UNHEALTHY,
        message: error.message,
      };
    }
  };
}

/**
 * Create an external service health check
 */
export function createServiceHealthCheck(
  name: string,
  url: string,
  timeoutMs: number = 5000
): HealthCheck {
  return async (): Promise<HealthCheckResult> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      return {
        name,
        status: response.ok ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        message: response.ok ? 'Available' : `HTTP ${response.status}`,
        details: { statusCode: response.status },
      };
    } catch (error: any) {
      return {
        name,
        status: HealthStatus.UNHEALTHY,
        message: error.name === 'AbortError' ? 'Timeout' : error.message,
      };
    }
  };
}

