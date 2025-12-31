import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode, Span } from '@opentelemetry/api';

/**
 * Tracing configuration options
 */
export interface TracingOptions {
  /** Service name for identification */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Jaeger endpoint */
  jaegerEndpoint?: string;
  /** Enable auto-instrumentation */
  autoInstrument?: boolean;
  /** Sample rate (0-1) */
  sampleRate?: number;
}

/**
 * Default tracing options
 */
export const DEFAULT_TRACING_OPTIONS: Partial<TracingOptions> = {
  serviceVersion: '1.0.0',
  jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  autoInstrument: true,
  sampleRate: 1.0,
};

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 */
export function initTracing(options: TracingOptions): void {
  if (sdk) {
    console.warn('[Tracing] Already initialized');
    return;
  }

  const mergedOptions = { ...DEFAULT_TRACING_OPTIONS, ...options };

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: mergedOptions.serviceName,
    [ATTR_SERVICE_VERSION]: mergedOptions.serviceVersion || '1.0.0',
  });

  const jaegerExporter = new JaegerExporter({
    endpoint: mergedOptions.jaegerEndpoint,
  });

  sdk = new NodeSDK({
    resource,
    traceExporter: jaegerExporter,
    instrumentations: mergedOptions.autoInstrument
      ? [getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        })]
      : [],
  });

  sdk.start();

  console.log(`[Tracing] Initialized for ${mergedOptions.serviceName}`);
  console.log(`[Tracing] Jaeger endpoint: ${mergedOptions.jaegerEndpoint}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('[Tracing] Shutdown complete'))
      .catch((err) => console.error('[Tracing] Shutdown error:', err));
  });
}

/**
 * Shutdown tracing
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

/**
 * Get the tracer for creating spans
 */
export function getTracer(name: string) {
  return trace.getTracer(name);
}

/**
 * Create a span for a function execution
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer('bento-social');
  
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }
      
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Decorator for tracing a method
 * Usage: @Trace('operationName')
 */
export function Trace(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return withSpan(name, async (span) => {
        span.setAttribute('method', propertyKey);
        span.setAttribute('class', target.constructor.name);
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

/**
 * Add custom attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value);
    }
  }
}

/**
 * Record an exception in current span
 */
export function recordSpanException(error: Error): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

