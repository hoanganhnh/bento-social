/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Execute a function with a timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Create a timeout-wrapped version of a function
 */
export function withTimeoutWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withTimeout(() => fn(...args), timeoutMs);
  };
}

/**
 * Decorator for timeout
 * Usage: @Timeout(5000)
 */
export function Timeout(timeoutMs: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withTimeout(() => originalMethod.apply(this, args), timeoutMs);
    };

    return descriptor;
  };
}

/**
 * Default timeout values for different operation types
 */
export const TIMEOUTS = {
  /** Fast operations like cache reads */
  FAST: 1000,
  /** Standard API calls */
  STANDARD: 5000,
  /** Database operations */
  DATABASE: 10000,
  /** External API calls */
  EXTERNAL: 30000,
  /** File uploads */
  UPLOAD: 60000,
  /** Long-running operations */
  LONG: 120000,
};

