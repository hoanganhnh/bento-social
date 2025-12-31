import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Metrics configuration options
 */
export interface MetricsOptions {
  /** Service name for labels */
  serviceName: string;
  /** Prefix for metric names */
  prefix?: string;
  /** Collect default Node.js metrics */
  collectDefaultMetrics?: boolean;
  /** Default labels to add to all metrics */
  defaultLabels?: Record<string, string>;
}

/**
 * Default metrics options
 */
export const DEFAULT_METRICS_OPTIONS: Partial<MetricsOptions> = {
  prefix: 'bento_',
  collectDefaultMetrics: true,
};

// Global registry
const registry = new Registry();

// Standard metrics
let httpRequestDuration: Histogram;
let httpRequestTotal: Counter;
let httpRequestErrors: Counter;
let activeConnections: Gauge;
let circuitBreakerState: Gauge;
let bulkheadActiveCount: Gauge;
let bulkheadQueueLength: Gauge;

/**
 * Initialize metrics
 */
export function initMetrics(options: MetricsOptions): void {
  const mergedOptions = { ...DEFAULT_METRICS_OPTIONS, ...options };
  const prefix = mergedOptions.prefix || '';

  // Set default labels
  if (mergedOptions.defaultLabels) {
    registry.setDefaultLabels({
      service: mergedOptions.serviceName,
      ...mergedOptions.defaultLabels,
    });
  } else {
    registry.setDefaultLabels({
      service: mergedOptions.serviceName,
    });
  }

  // Collect default Node.js metrics
  if (mergedOptions.collectDefaultMetrics) {
    collectDefaultMetrics({ register: registry, prefix });
  }

  // HTTP Request Duration Histogram
  httpRequestDuration = new Histogram({
    name: `${prefix}http_request_duration_seconds`,
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  // HTTP Request Counter
  httpRequestTotal = new Counter({
    name: `${prefix}http_requests_total`,
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
  });

  // HTTP Errors Counter
  httpRequestErrors = new Counter({
    name: `${prefix}http_request_errors_total`,
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'error_type'],
    registers: [registry],
  });

  // Active Connections Gauge
  activeConnections = new Gauge({
    name: `${prefix}active_connections`,
    help: 'Number of active connections',
    registers: [registry],
  });

  // Circuit Breaker State Gauge (0=closed, 1=open, 2=half-open)
  circuitBreakerState = new Gauge({
    name: `${prefix}circuit_breaker_state`,
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    labelNames: ['name'],
    registers: [registry],
  });

  // Bulkhead Metrics
  bulkheadActiveCount = new Gauge({
    name: `${prefix}bulkhead_active_count`,
    help: 'Number of active executions in bulkhead',
    labelNames: ['name'],
    registers: [registry],
  });

  bulkheadQueueLength = new Gauge({
    name: `${prefix}bulkhead_queue_length`,
    help: 'Number of queued executions in bulkhead',
    labelNames: ['name'],
    registers: [registry],
  });

  console.log(`[Metrics] Initialized for ${mergedOptions.serviceName}`);
}

/**
 * Get the metrics registry
 */
export function getRegistry(): Registry {
  return registry;
}

/**
 * Get metrics as string (for /metrics endpoint)
 */
export async function getMetrics(): Promise<string> {
  return registry.metrics();
}

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number
): void {
  const labels = { method, route, status_code: String(statusCode) };
  
  httpRequestDuration?.observe(labels, durationMs / 1000);
  httpRequestTotal?.inc(labels);
  
  if (statusCode >= 400) {
    httpRequestErrors?.inc({
      method,
      route,
      error_type: statusCode >= 500 ? 'server_error' : 'client_error',
    });
  }
}

/**
 * Update active connections count
 */
export function updateActiveConnections(count: number): void {
  activeConnections?.set(count);
}

/**
 * Increment active connections
 */
export function incActiveConnections(): void {
  activeConnections?.inc();
}

/**
 * Decrement active connections
 */
export function decActiveConnections(): void {
  activeConnections?.dec();
}

/**
 * Update circuit breaker state
 */
export function updateCircuitBreakerState(name: string, state: 'closed' | 'open' | 'halfOpen'): void {
  const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
  circuitBreakerState?.set({ name }, stateValue);
}

/**
 * Update bulkhead metrics
 */
export function updateBulkheadMetrics(
  name: string,
  activeCount: number,
  queueLength: number
): void {
  bulkheadActiveCount?.set({ name }, activeCount);
  bulkheadQueueLength?.set({ name }, queueLength);
}

/**
 * Create a custom counter
 */
export function createCounter(
  name: string,
  help: string,
  labelNames: string[] = []
): Counter {
  return new Counter({
    name,
    help,
    labelNames,
    registers: [registry],
  });
}

/**
 * Create a custom histogram
 */
export function createHistogram(
  name: string,
  help: string,
  labelNames: string[] = [],
  buckets?: number[]
): Histogram {
  return new Histogram({
    name,
    help,
    labelNames,
    buckets: buckets || [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });
}

/**
 * Create a custom gauge
 */
export function createGauge(
  name: string,
  help: string,
  labelNames: string[] = []
): Gauge {
  return new Gauge({
    name,
    help,
    labelNames,
    registers: [registry],
  });
}

/**
 * Express middleware for recording HTTP metrics
 */
export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    incActiveConnections();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path || 'unknown';
      
      recordHttpRequest(req.method, route, res.statusCode, duration);
      decActiveConnections();
    });

    next();
  };
}

