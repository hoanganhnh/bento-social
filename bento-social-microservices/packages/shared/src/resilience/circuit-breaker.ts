import CircuitBreaker from 'opossum';

/**
 * Circuit Breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Name for identification and metrics */
  name: string;
  /** Time in milliseconds before the circuit breaker times out */
  timeout?: number;
  /** Error percentage at which to open the circuit */
  errorThresholdPercentage?: number;
  /** Time in milliseconds to wait before testing the circuit */
  resetTimeout?: number;
  /** Number of requests to allow before tripping circuit */
  volumeThreshold?: number;
  /** Allow half-open state to test if service recovered */
  allowHalfOpen?: boolean;
  /** Fallback function when circuit is open */
  fallback?: (...args: any[]) => any;
}

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Partial<CircuitBreakerOptions> = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // 50% error rate
  resetTimeout: 30000, // 30 seconds
  volumeThreshold: 5, // 5 requests minimum before tripping
  allowHalfOpen: true,
};

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'halfOpen',
}

/**
 * Circuit breaker stats
 */
export interface CircuitBreakerStats {
  name: string;
  state: CircuitBreakerState;
  successes: number;
  failures: number;
  fallbacks: number;
  timeouts: number;
  rejects: number;
  cacheHits: number;
  cacheMisses: number;
  percentiles: Record<string, number>;
}

/**
 * Create a circuit breaker for a function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions
): CircuitBreaker {
  const mergedOptions = {
    ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
    ...options,
  };

  const breaker = new CircuitBreaker(fn, {
    timeout: mergedOptions.timeout,
    errorThresholdPercentage: mergedOptions.errorThresholdPercentage,
    resetTimeout: mergedOptions.resetTimeout,
    volumeThreshold: mergedOptions.volumeThreshold,
    name: mergedOptions.name,
  });

  // Set up event handlers for logging/metrics
  breaker.on('success', (result) => {
    console.log(`[CircuitBreaker:${options.name}] Success`);
  });

  breaker.on('failure', (error) => {
    console.error(`[CircuitBreaker:${options.name}] Failure:`, error.message);
  });

  breaker.on('timeout', () => {
    console.warn(`[CircuitBreaker:${options.name}] Timeout`);
  });

  breaker.on('reject', () => {
    console.warn(`[CircuitBreaker:${options.name}] Rejected (circuit open)`);
  });

  breaker.on('open', () => {
    console.warn(`[CircuitBreaker:${options.name}] Circuit OPENED`);
  });

  breaker.on('halfOpen', () => {
    console.log(`[CircuitBreaker:${options.name}] Circuit HALF-OPEN`);
  });

  breaker.on('close', () => {
    console.log(`[CircuitBreaker:${options.name}] Circuit CLOSED`);
  });

  // Set fallback if provided
  if (mergedOptions.fallback) {
    breaker.fallback(mergedOptions.fallback);
  }

  return breaker;
}

/**
 * Get circuit breaker stats
 */
export function getCircuitBreakerStats(breaker: CircuitBreaker): CircuitBreakerStats {
  const stats = breaker.stats;
  const status = breaker.status as any;
  return {
    name: breaker.name,
    state: (status.name || 'closed') as CircuitBreakerState,
    successes: stats.successes,
    failures: stats.failures,
    fallbacks: stats.fallbacks,
    timeouts: stats.timeouts,
    rejects: stats.rejects,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    percentiles: stats.percentiles,
  };
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Register a circuit breaker
   */
  register(name: string, breaker: CircuitBreaker): void {
    this.breakers.set(name, breaker);
  }

  /**
   * Get a circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get stats for all circuit breakers
   */
  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.breakers.values()).map(getCircuitBreakerStats);
  }

  /**
   * Shutdown all circuit breakers
   */
  shutdown(): void {
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }
    this.breakers.clear();
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

