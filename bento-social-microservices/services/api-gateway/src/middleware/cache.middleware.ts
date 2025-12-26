import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory cache for response caching
 * In production, consider using Redis for distributed caching
 */
interface CacheEntry {
  data: any;
  headers: Record<string, string>;
  timestamp: number;
  ttl: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Generate cache key from request
   */
  generateKey(req: Request): string {
    const userId = (req as any).userId || 'anonymous';
    return `${req.method}:${req.originalUrl}:${userId}`;
  }

  /**
   * Get cached response
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set cached response
   */
  set(key: string, data: any, headers: Record<string, string>, ttl: number): void {
    this.cache.set(key, {
      data,
      headers,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton cache instance
export const responseCache = new ResponseCache();

/**
 * Cache configuration by route pattern
 */
export interface CacheConfig {
  /** Route pattern to match */
  pattern: RegExp;
  /** TTL in milliseconds */
  ttl: number;
  /** HTTP methods to cache */
  methods: string[];
  /** Whether to vary cache by user */
  varyByUser?: boolean;
}

/**
 * Default cache configurations
 */
export const CACHE_CONFIGS: CacheConfig[] = [
  // Cache topic list for 5 minutes
  {
    pattern: /^\/v1\/topics$/,
    ttl: 5 * 60 * 1000,
    methods: ['GET'],
    varyByUser: false,
  },
  // Cache individual topic for 5 minutes
  {
    pattern: /^\/v1\/topics\/[^/]+$/,
    ttl: 5 * 60 * 1000,
    methods: ['GET'],
    varyByUser: false,
  },
  // Cache suggested users for 1 minute
  {
    pattern: /^\/v1\/users-suggested$/,
    ttl: 60 * 1000,
    methods: ['GET'],
    varyByUser: true,
  },
  // Cache user profiles for 30 seconds
  {
    pattern: /^\/v1\/users\/[^/]+$/,
    ttl: 30 * 1000,
    methods: ['GET'],
    varyByUser: false,
  },
  // Cache post list for 15 seconds
  {
    pattern: /^\/v1\/posts$/,
    ttl: 15 * 1000,
    methods: ['GET'],
    varyByUser: false,
  },
  // Cache individual post for 30 seconds
  {
    pattern: /^\/v1\/posts\/[^/]+$/,
    ttl: 30 * 1000,
    methods: ['GET'],
    varyByUser: false,
  },
  // Cache notifications for 10 seconds
  {
    pattern: /^\/v1\/notifications$/,
    ttl: 10 * 1000,
    methods: ['GET'],
    varyByUser: true,
  },
];

/**
 * Find matching cache config for request
 */
function findCacheConfig(req: Request): CacheConfig | null {
  for (const config of CACHE_CONFIGS) {
    if (config.pattern.test(req.path) && config.methods.includes(req.method)) {
      return config;
    }
  }
  return null;
}

/**
 * Check if request should be cached
 */
function shouldCache(req: Request): boolean {
  // Only cache GET requests
  if (req.method !== 'GET') return false;

  // Don't cache if no-cache header is present
  if (req.headers['cache-control']?.includes('no-cache')) return false;

  // Check if route has cache config
  return findCacheConfig(req) !== null;
}

/**
 * Response caching middleware
 */
export function cacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip if not cacheable
  if (!shouldCache(req)) {
    next();
    return;
  }

  const cacheConfig = findCacheConfig(req);
  if (!cacheConfig) {
    next();
    return;
  }

  // Generate cache key
  let cacheKey = `${req.method}:${req.path}`;
  if (cacheConfig.varyByUser) {
    const userId = (req as any).userId || 'anonymous';
    cacheKey += `:${userId}`;
  }
  // Include query string in cache key
  if (Object.keys(req.query).length > 0) {
    cacheKey += `:${JSON.stringify(req.query)}`;
  }

  // Check cache
  const cached = responseCache.get(cacheKey);
  if (cached) {
    // Set cache headers
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-TTL', String(Math.max(0, cacheConfig.ttl - (Date.now() - cached.timestamp))));
    
    // Forward cached headers
    for (const [key, value] of Object.entries(cached.headers)) {
      if (!['x-cache', 'x-cache-ttl'].includes(key.toLowerCase())) {
        res.set(key, value);
      }
    }

    res.json(cached.data);
    return;
  }

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const headers: Record<string, string> = {};
      const headersToCache = ['content-type', 'x-request-id'];
      headersToCache.forEach((h) => {
        const value = res.get(h);
        if (value) headers[h] = value;
      });

      responseCache.set(cacheKey, data, headers, cacheConfig.ttl);
    }

    res.set('X-Cache', 'MISS');
    return originalJson(data);
  };

  next();
}

/**
 * Cache invalidation middleware for write operations
 * Call this after POST, PUT, PATCH, DELETE operations
 */
export function cacheInvalidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only invalidate on successful write operations
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Invalidate related caches based on route
      if (req.path.includes('/posts')) {
        responseCache.invalidate('/posts');
      }
      if (req.path.includes('/topics')) {
        responseCache.invalidate('/topics');
      }
      if (req.path.includes('/users')) {
        responseCache.invalidate('/users');
      }
      if (req.path.includes('/notifications')) {
        responseCache.invalidate('/notifications');
      }
    }
    return originalJson(data);
  };

  next();
}

