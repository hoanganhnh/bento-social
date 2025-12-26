import { trace } from '@opentelemetry/api';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string;
  spanId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerOptions {
  serviceName: string;
  level?: LogLevel;
  jsonFormat?: boolean;
}

/**
 * Default logger options
 */
export const DEFAULT_LOGGER_OPTIONS: Partial<LoggerOptions> = {
  level: LogLevel.INFO,
  jsonFormat: process.env.NODE_ENV === 'production',
};

/**
 * Structured logger with trace context
 */
export class Logger {
  private readonly serviceName: string;
  private readonly minLevel: LogLevel;
  private readonly jsonFormat: boolean;

  private static readonly levelOrder: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(options: LoggerOptions) {
    const mergedOptions = { ...DEFAULT_LOGGER_OPTIONS, ...options };
    this.serviceName = mergedOptions.serviceName;
    this.minLevel = mergedOptions.level!;
    this.jsonFormat = mergedOptions.jsonFormat!;
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return Logger.levelOrder[level] >= Logger.levelOrder[this.minLevel];
  }

  /**
   * Get current trace context
   */
  private getTraceContext(): { traceId?: string; spanId?: string } {
    const span = trace.getActiveSpan();
    if (span) {
      const spanContext = span.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
    return {};
  }

  /**
   * Format and output log entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const traceContext = this.getTraceContext();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...traceContext,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    const output = this.jsonFormat
      ? JSON.stringify(entry)
      : this.formatPretty(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Format log entry for human readability
   */
  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    let output = `${levelColors[entry.level]}[${entry.level.toUpperCase()}]${reset} `;
    output += `[${entry.service}] `;
    
    if (entry.traceId) {
      output += `[trace:${entry.traceId.slice(0, 8)}] `;
    }
    
    output += entry.message;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  ${entry.error.stack}`;
      }
    }

    return output;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

/**
 * Create a logger instance
 */
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

