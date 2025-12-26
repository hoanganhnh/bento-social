/**
 * Bulkhead pattern implementation
 * Limits concurrent requests to prevent resource exhaustion
 */

/**
 * Bulkhead configuration options
 */
export interface BulkheadOptions {
  /** Name for identification */
  name: string;
  /** Maximum concurrent executions */
  maxConcurrent: number;
  /** Maximum queue size (0 = no queue) */
  maxQueue?: number;
  /** Queue timeout in ms */
  queueTimeout?: number;
}

/**
 * Default bulkhead options
 */
export const DEFAULT_BULKHEAD_OPTIONS: Partial<BulkheadOptions> = {
  maxConcurrent: 10,
  maxQueue: 100,
  queueTimeout: 30000,
};

/**
 * Bulkhead rejection error
 */
export class BulkheadRejectError extends Error {
  constructor(message: string = 'Bulkhead capacity exceeded') {
    super(message);
    this.name = 'BulkheadRejectError';
  }
}

/**
 * Bulkhead stats
 */
export interface BulkheadStats {
  name: string;
  activeCount: number;
  queueLength: number;
  maxConcurrent: number;
  maxQueue: number;
  totalExecuted: number;
  totalRejected: number;
}

/**
 * Queued task
 */
interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeoutId?: NodeJS.Timeout;
}

/**
 * Bulkhead implementation
 */
export class Bulkhead {
  private readonly name: string;
  private readonly maxConcurrent: number;
  private readonly maxQueue: number;
  private readonly queueTimeout: number;
  
  private activeCount = 0;
  private queue: QueuedTask<any>[] = [];
  private totalExecuted = 0;
  private totalRejected = 0;

  constructor(options: BulkheadOptions) {
    const mergedOptions = { ...DEFAULT_BULKHEAD_OPTIONS, ...options };
    this.name = mergedOptions.name;
    this.maxConcurrent = mergedOptions.maxConcurrent!;
    this.maxQueue = mergedOptions.maxQueue!;
    this.queueTimeout = mergedOptions.queueTimeout!;
  }

  /**
   * Execute a function within the bulkhead
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we can execute immediately
    if (this.activeCount < this.maxConcurrent) {
      return this.executeNow(fn);
    }

    // Check if queue is full
    if (this.queue.length >= this.maxQueue) {
      this.totalRejected++;
      console.warn(`[Bulkhead:${this.name}] Rejected - queue full`);
      throw new BulkheadRejectError(`Bulkhead ${this.name} queue is full`);
    }

    // Add to queue
    return this.enqueue(fn);
  }

  /**
   * Execute a function immediately
   */
  private async executeNow<T>(fn: () => Promise<T>): Promise<T> {
    this.activeCount++;
    
    try {
      const result = await fn();
      this.totalExecuted++;
      return result;
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  /**
   * Add a task to the queue
   */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask<T> = { fn, resolve, reject };

      // Set queue timeout
      if (this.queueTimeout > 0) {
        task.timeoutId = setTimeout(() => {
          const index = this.queue.indexOf(task);
          if (index > -1) {
            this.queue.splice(index, 1);
            this.totalRejected++;
            reject(new BulkheadRejectError(`Bulkhead ${this.name} queue timeout`));
          }
        }, this.queueTimeout);
      }

      this.queue.push(task);
      console.log(`[Bulkhead:${this.name}] Queued - position ${this.queue.length}`);
    });
  }

  /**
   * Process the next item in the queue
   */
  private processQueue(): void {
    if (this.queue.length === 0 || this.activeCount >= this.maxConcurrent) {
      return;
    }

    const task = this.queue.shift()!;
    
    // Clear timeout
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }

    // Execute the task
    this.executeNow(task.fn)
      .then(task.resolve)
      .catch(task.reject);
  }

  /**
   * Get bulkhead stats
   */
  getStats(): BulkheadStats {
    return {
      name: this.name,
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue,
      totalExecuted: this.totalExecuted,
      totalRejected: this.totalRejected,
    };
  }

  /**
   * Shutdown the bulkhead
   */
  shutdown(): void {
    // Clear all queued tasks
    for (const task of this.queue) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      task.reject(new BulkheadRejectError('Bulkhead shutdown'));
    }
    this.queue = [];
  }
}

/**
 * Bulkhead registry for managing multiple bulkheads
 */
class BulkheadRegistry {
  private bulkheads: Map<string, Bulkhead> = new Map();

  /**
   * Get or create a bulkhead
   */
  getOrCreate(options: BulkheadOptions): Bulkhead {
    let bulkhead = this.bulkheads.get(options.name);
    if (!bulkhead) {
      bulkhead = new Bulkhead(options);
      this.bulkheads.set(options.name, bulkhead);
    }
    return bulkhead;
  }

  /**
   * Get a bulkhead by name
   */
  get(name: string): Bulkhead | undefined {
    return this.bulkheads.get(name);
  }

  /**
   * Get stats for all bulkheads
   */
  getAllStats(): BulkheadStats[] {
    return Array.from(this.bulkheads.values()).map(b => b.getStats());
  }

  /**
   * Shutdown all bulkheads
   */
  shutdown(): void {
    for (const bulkhead of this.bulkheads.values()) {
      bulkhead.shutdown();
    }
    this.bulkheads.clear();
  }
}

export const bulkheadRegistry = new BulkheadRegistry();

