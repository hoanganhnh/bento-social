import retry from 'async-retry';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Number of retry attempts */
  retries?: number;
  /** Factor for exponential backoff */
  factor?: number;
  /** Minimum timeout in ms */
  minTimeout?: number;
  /** Maximum timeout in ms */
  maxTimeout?: number;
  /** Randomize timeouts */
  randomize?: boolean;
  /** Function to determine if error is retryable */
  onRetry?: (error: Error, attempt: number) => void;
  /** Bail out on specific errors */
  bail?: (error: Error) => boolean;
}

/**
 * Default retry options with exponential backoff
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 3,
  factor: 2,
  minTimeout: 1000, // 1 second
  maxTimeout: 10000, // 10 seconds
  randomize: true,
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: (bail: (e: Error) => void, attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const mergedOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  return retry(fn, {
    retries: mergedOptions.retries,
    factor: mergedOptions.factor,
    minTimeout: mergedOptions.minTimeout,
    maxTimeout: mergedOptions.maxTimeout,
    randomize: mergedOptions.randomize,
    onRetry: (error, attempt) => {
      console.log(`[Retry] Attempt ${attempt} failed:`, error.message);
      if (mergedOptions.onRetry) {
        mergedOptions.onRetry(error, attempt);
      }
    },
  });
}

/**
 * Create a retryable version of a function
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(async (bail, attempt) => {
      try {
        return await fn(...args);
      } catch (error: any) {
        // Bail on non-retryable errors (4xx except 429)
        if (options.bail && options.bail(error)) {
          bail(error);
          throw error; // This won't be reached, but TypeScript needs it
        }
        
        // Don't retry on client errors (except rate limiting)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          bail(error);
          throw error;
        }
        
        throw error;
      }
    }, options);
  };
}

/**
 * Decorator for retry logic
 * Usage: @Retryable({ retries: 3 })
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(async (bail, attempt) => {
        try {
          return await originalMethod.apply(this, args);
        } catch (error: any) {
          // Don't retry on client errors (except rate limiting)
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            bail(error);
            throw error;
          }
          throw error;
        }
      }, options);
    };

    return descriptor;
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP 5xx errors and rate limiting
  if (error.status >= 500 || error.status === 429) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
    return true;
  }

  return false;
}

