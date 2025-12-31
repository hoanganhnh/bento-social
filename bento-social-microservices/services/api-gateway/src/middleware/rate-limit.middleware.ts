import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests per window */
  max: number;
  /** Message to return when rate limited */
  message?: string;
  /** Skip rate limiting for certain requests */
  skip?: (req: Request) => boolean;
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.',
};

/**
 * Rate limits by route type
 */
export const RATE_LIMITS = {
  /** General API rate limit */
  general: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
  },
  /** Authentication endpoints (more restrictive) */
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per 15 minutes
  },
  /** File uploads (more restrictive) */
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
  },
  /** RPC/internal endpoints (more lenient) */
  rpc: {
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute
  },
};

/**
 * Create general rate limiter
 */
export const generalRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  message: {
    statusCode: 429,
    message: 'Too many requests, please try again later.',
    error: 'Too Many Requests',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  validate: { xForwardedForHeader: false },
});

/**
 * Create authentication rate limiter (stricter)
 */
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.auth.windowMs,
  max: RATE_LIMITS.auth.max,
  message: {
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later.',
    error: 'Too Many Requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Create upload rate limiter
 */
export const uploadRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.upload.windowMs,
  max: RATE_LIMITS.upload.max,
  message: {
    statusCode: 429,
    message: 'Too many uploads, please try again later.',
    error: 'Too Many Requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Create RPC rate limiter (more lenient for internal calls)
 */
export const rpcRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.rpc.windowMs,
  max: RATE_LIMITS.rpc.max,
  message: {
    statusCode: 429,
    message: 'Too many requests, please try again later.',
    error: 'Too Many Requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Get appropriate rate limiter based on request path
 */
export function getRateLimiterForPath(path: string) {
  if (path.includes('/authenticate') || path.includes('/register')) {
    return authRateLimiter;
  }
  if (path.includes('/upload')) {
    return uploadRateLimiter;
  }
  if (path.includes('/rpc/')) {
    return rpcRateLimiter;
  }
  return generalRateLimiter;
}

/**
 * Composite rate limiting middleware
 * Applies appropriate rate limiter based on route
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const limiter = getRateLimiterForPath(req.path);
  limiter(req, res, next);
}

