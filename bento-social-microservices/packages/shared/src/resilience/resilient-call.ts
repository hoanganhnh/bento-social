import { createCircuitBreaker, CircuitBreakerOptions, circuitBreakerRegistry } from './circuit-breaker';
import { withRetry, RetryOptions } from './retry';
import { withTimeout } from './timeout';
import { Bulkhead, BulkheadOptions, bulkheadRegistry } from './bulkhead';
import CircuitBreaker from 'opossum';

/**
 * Combined resilience options
 */
export interface ResilienceOptions {
  /** Name for identification */
  name: string;
  /** Timeout in ms (0 = no timeout) */
  timeout?: number;
  /** Retry options (null = no retry) */
  retry?: RetryOptions | null;
  /** Circuit breaker options (null = no circuit breaker) */
  circuitBreaker?: Partial<CircuitBreakerOptions> | null;
  /** Bulkhead options (null = no bulkhead) */
  bulkhead?: Partial<BulkheadOptions> | null;
  /** Fallback function */
  fallback?: (...args: any[]) => any;
}

/**
 * Default resilience options
 */
export const DEFAULT_RESILIENCE_OPTIONS: Partial<ResilienceOptions> = {
  timeout: 10000,
  retry: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
  },
  circuitBreaker: {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 5,
  },
  bulkhead: null, // Disabled by default
};

/**
 * Execute a function with combined resilience patterns
 * Order: Bulkhead → Circuit Breaker → Retry → Timeout → Function
 */
export async function resilientCall<T>(
  fn: () => Promise<T>,
  options: ResilienceOptions
): Promise<T> {
  const mergedOptions = { ...DEFAULT_RESILIENCE_OPTIONS, ...options };

  // Build the execution chain
  let execution = fn;

  // Wrap with timeout
  if (mergedOptions.timeout && mergedOptions.timeout > 0) {
    const timeout = mergedOptions.timeout;
    const originalExecution = execution;
    execution = () => withTimeout(originalExecution, timeout);
  }

  // Wrap with retry
  if (mergedOptions.retry) {
    const retryOptions = mergedOptions.retry;
    const originalExecution = execution;
    execution = () => withRetry(
      async (bail, attempt) => {
        try {
          return await originalExecution();
        } catch (error: any) {
          // Don't retry on client errors
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            bail(error);
            throw error;
          }
          throw error;
        }
      },
      retryOptions
    );
  }

  // Get or create circuit breaker
  let circuitBreaker: CircuitBreaker | undefined;
  if (mergedOptions.circuitBreaker) {
    const cbName = `${options.name}-cb`;
    circuitBreaker = circuitBreakerRegistry.get(cbName);
    
    if (!circuitBreaker) {
      const cbOptions: CircuitBreakerOptions = {
        name: cbName,
        ...mergedOptions.circuitBreaker,
      };
      
      if (mergedOptions.fallback) {
        cbOptions.fallback = mergedOptions.fallback;
      }
      
      circuitBreaker = createCircuitBreaker(
        async () => execution(),
        cbOptions
      );
      circuitBreakerRegistry.register(cbName, circuitBreaker);
    }
  }

  // Get or create bulkhead
  let bulkhead: Bulkhead | undefined;
  if (mergedOptions.bulkhead) {
    const bhName = `${options.name}-bh`;
    bulkhead = bulkheadRegistry.getOrCreate({
      name: bhName,
      maxConcurrent: mergedOptions.bulkhead.maxConcurrent || 10,
      ...mergedOptions.bulkhead,
    });
  }

  // Execute with resilience patterns
  const executeWithResilience = async (): Promise<T> => {
    if (circuitBreaker) {
      return circuitBreaker.fire() as Promise<T>;
    }
    return execution();
  };

  if (bulkhead) {
    return bulkhead.execute(executeWithResilience);
  }

  return executeWithResilience();
}

/**
 * Create a resilient version of a function
 */
export function createResilientFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ResilienceOptions
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return resilientCall(() => fn(...args), options);
  };
}

