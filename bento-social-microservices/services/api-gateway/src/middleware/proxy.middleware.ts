import {
  createProxyMiddleware,
  Options,
  RequestHandler,
} from "http-proxy-middleware";
import { Request, Response, NextFunction } from "express";
import {
  SERVICE_TARGETS,
  PROXY_ROUTES,
  RouteConfig,
} from "../config/proxy.config";

/**
 * Logger for proxy middleware
 */
const logger = {
  info: (message: string) => console.log(`[Proxy] ${message}`),
  error: (message: string) => console.error(`[Proxy] ${message}`),
  debug: (message: string) => {
    if (process.env.DEBUG === "true") {
      console.log(`[Proxy:Debug] ${message}`);
    }
  },
};

/**
 * Match route pattern to request path
 * Supports :param style patterns
 */
function matchRoute(path: string, pattern: string): boolean {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);

  // If path has fewer parts than pattern, no match
  if (pathParts.length < patternParts.length) {
    return false;
  }

  // Check if all pattern parts match
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Skip parameter parts (e.g., :id)
    if (patternPart.startsWith(":")) {
      continue;
    }

    if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
}

/**
 * Find the best matching route for a given path
 * Returns the most specific matching route (longest pattern)
 */
function findMatchingRoute(path: string): RouteConfig | null {
  // Sort routes by specificity (longer paths first)
  const sortedRoutes = [...PROXY_ROUTES].sort(
    (a, b) => b.path.length - a.path.length,
  );

  for (const route of sortedRoutes) {
    if (matchRoute(path, route.path)) {
      return route;
    }
  }

  return null;
}

/**
 * Build path rewrite function that handles :param patterns
 */
function buildPathRewrite(
  pattern: string,
  targetPath: string,
): (path: string, req: Request) => string {
  return (path: string, req: Request) => {
    // Extract params from original path
    const pathParts = path.split("/").filter(Boolean);
    const patternParts = pattern.split("/").filter(Boolean);
    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(":")) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      }
    }

    // Replace params in target path
    let newPath = targetPath;
    for (const [key, value] of Object.entries(params)) {
      newPath = newPath.replace(`:${key}`, value);
    }

    // Handle extra path segments after the matched route
    if (pathParts.length > patternParts.length) {
      const extraParts = pathParts.slice(patternParts.length);
      newPath = `${newPath}/${extraParts.join("/")}`;
    }

    return newPath;
  };
}

/**
 * Create proxy middleware for a specific route
 */
function createRouteProxy(route: RouteConfig): RequestHandler {
  const service = SERVICE_TARGETS[route.service];
  if (!service) {
    throw new Error(`Unknown service: ${route.service}`);
  }

  const options: Options = {
    target: service.url,
    changeOrigin: route.changeOrigin !== false,
    timeout: route.timeout || 30000,
    proxyTimeout: route.timeout || 30000,
    pathRewrite: route.pathRewrite,
    on: {
      proxyReq: (proxyReq, req: any, res) => {
        const startTime = Date.now();
        (req as any).__proxyStartTime = startTime;

        // Forward relevant headers
        const forwardHeaders = [
          "authorization",
          "x-request-id",
          "x-correlation-id",
          "content-type",
        ];
        forwardHeaders.forEach((header) => {
          const value = req.headers[header];
          if (value && typeof value === "string") {
            proxyReq.setHeader(header, value);
          }
        });

        logger.debug(
          `→ ${req.method} ${req.originalUrl} -> ${service.url}${proxyReq.path}`,
        );
      },
      proxyRes: (proxyRes, req: any, res) => {
        const duration =
          Date.now() - ((req as any).__proxyStartTime || Date.now());
        logger.info(
          `${req.method} ${req.originalUrl} -> ${proxyRes.statusCode} (${duration}ms) [${service.name}]`,
        );

        // Add service identifier header
        proxyRes.headers["x-served-by"] = service.name;
      },
      error: (err, req: any, res: any) => {
        const duration =
          Date.now() - ((req as any).__proxyStartTime || Date.now());
        logger.error(
          `${req.method} ${req.originalUrl} -> ERROR (${duration}ms): ${err.message}`,
        );

        if (res && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              statusCode: 502,
              message: "Service unavailable",
              error: "Bad Gateway",
              service: service.name,
            }),
          );
        }
      },
    },
  };

  return createProxyMiddleware(options);
}

/**
 * Cache for route proxies
 */
const proxyCache = new Map<string, RequestHandler>();

/**
 * Get or create proxy handler for a route
 */
function getOrCreateProxy(route: RouteConfig): RequestHandler {
  const cacheKey = `${route.service}:${route.path}`;

  if (!proxyCache.has(cacheKey)) {
    proxyCache.set(cacheKey, createRouteProxy(route));
  }

  return proxyCache.get(cacheKey)!;
}

/**
 * Main proxy middleware
 * Routes requests to appropriate microservices based on path matching
 */
export function proxyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const route = findMatchingRoute(req.path);

  if (!route) {
    // No matching route, pass to next handler (might be 404)
    return next();
  }

  const service = SERVICE_TARGETS[route.service];
  if (!service) {
    logger.error(`Unknown service: ${route.service}`);
    return next();
  }

  // Build custom path rewrite if route has params
  if (route.path.includes(":")) {
    // Extract the base target path (remove /v1 prefix)
    const targetPath = route.path.replace("/v1", "");
    const rewriter = buildPathRewrite(route.path, targetPath);

    // Create proxy with custom path rewrite
    const options: Options = {
      target: service.url,
      changeOrigin: true,
      timeout: route.timeout || 30000,
      proxyTimeout: route.timeout || 30000,
      pathRewrite: (path) => rewriter(path, req),
      on: {
        proxyReq: (proxyReq, req: any, res) => {
          const startTime = Date.now();
          (req as any).__proxyStartTime = startTime;

          // Forward relevant headers
          const forwardHeaders = [
            "authorization",
            "x-request-id",
            "x-correlation-id",
            "content-type",
          ];
          forwardHeaders.forEach((header) => {
            const value = req.headers[header];
            if (value && typeof value === "string") {
              proxyReq.setHeader(header, value);
            }
          });

          logger.debug(
            `→ ${req.method} ${req.originalUrl} -> ${service.url}${proxyReq.path}`,
          );
        },
        proxyRes: (proxyRes, req: any, res) => {
          const duration =
            Date.now() - ((req as any).__proxyStartTime || Date.now());
          logger.info(
            `${req.method} ${req.originalUrl} -> ${proxyRes.statusCode} (${duration}ms) [${service.name}]`,
          );
          proxyRes.headers["x-served-by"] = service.name;
        },
        error: (err, req: any, res: any) => {
          const duration =
            Date.now() - ((req as any).__proxyStartTime || Date.now());
          logger.error(
            `${req.method} ${req.originalUrl} -> ERROR (${duration}ms): ${err.message}`,
          );

          if (res && !res.headersSent) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                statusCode: 502,
                message: "Service unavailable",
                error: "Bad Gateway",
                service: service.name,
              }),
            );
          }
        },
      },
    };

    const proxy = createProxyMiddleware(options);
    proxy(req, res, next);
    return;
  }

  // Use cached proxy for routes without params
  const proxy = getOrCreateProxy(route);
  proxy(req, res, next);
}

/**
 * Health check bypass middleware
 * Passes health check requests directly to NestJS health controller
 */
export function healthCheckBypass(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === "/health" || req.path === "/api/health") {
    next();
    return;
  }
  proxyMiddleware(req, res, next);
}
