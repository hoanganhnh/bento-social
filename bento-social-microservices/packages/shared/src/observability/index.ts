// Tracing
export {
  initTracing,
  shutdownTracing,
  getTracer,
  withSpan,
  Trace,
  addSpanAttributes,
  recordSpanException,
  TracingOptions,
  DEFAULT_TRACING_OPTIONS,
} from './tracing';

// Metrics
export {
  initMetrics,
  getRegistry,
  getMetrics,
  recordHttpRequest,
  updateActiveConnections,
  incActiveConnections,
  decActiveConnections,
  updateCircuitBreakerState,
  updateBulkheadMetrics,
  createCounter,
  createHistogram,
  createGauge,
  metricsMiddleware,
  MetricsOptions,
  DEFAULT_METRICS_OPTIONS,
} from './metrics';

// Logging
export {
  Logger,
  createLogger,
  LogLevel,
  LogEntry,
  LoggerOptions,
  DEFAULT_LOGGER_OPTIONS,
} from './logging';

// Health Checks
export {
  HealthCheck,
  HealthCheckResult,
  HealthStatus,
  createHealthChecker,
  HealthChecker,
} from './health';

