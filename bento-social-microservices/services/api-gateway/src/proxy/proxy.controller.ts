import { Controller, All, Req, Res, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import {
  SERVICE_TARGETS,
  PROXY_ROUTES,
  RouteConfig,
} from "../config/proxy.config";

@Controller("v1")
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  @All("*")
  proxyRequest(@Req() req: Request, @Res() res: Response) {
    const startTime = Date.now();
    // req.path already contains the full path including /v1
    const fullPath = req.path;

    // Find matching route
    const route = this.findMatchingRoute(fullPath);

    if (!route) {
      const duration = Date.now() - startTime;
      this.logger.warn(
        `No route found for ${req.method} ${fullPath} (${duration}ms)`,
      );
      res.status(404).json({
        statusCode: 404,
        message: `Route not found: ${fullPath}`,
        error: "Not Found",
      });
      return;
    }

    const service = SERVICE_TARGETS[route.service];
    if (!service) {
      this.logger.error(`Unknown service: ${route.service}`);
      res.status(500).json({
        statusCode: 500,
        message: "Service configuration error",
        error: "Internal Server Error",
      });
      return;
    }

    // Build path rewrite function
    let pathRewrite:
      | ((path: string, req: Request) => string)
      | Record<string, string>
      | undefined;

    if (route.pathRewrite) {
      // If pathRewrite is provided, use it directly
      pathRewrite = route.pathRewrite;
    }

    // Create proxy options
    const options: Options = {
      target: service.url,
      changeOrigin: true,
      timeout: route.timeout || 30000,
      proxyTimeout: route.timeout || 30000,
      pathRewrite: pathRewrite,
      on: {
        proxyReq: (proxyReq, req: any) => {
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

          this.logger.debug(
            `→ ${req.method} ${fullPath} -> ${service.url}${proxyReq.path}`,
          );
        },
        proxyRes: (proxyRes, req: any) => {
          const duration =
            Date.now() - ((req as any).__proxyStartTime || startTime);
          this.logger.log(
            `${req.method} ${fullPath} -> ${proxyRes.statusCode} (${duration}ms) [${service.name}]`,
          );

          // Add service identifier header
          proxyRes.headers["x-served-by"] = service.name;
        },
        error: (err, req: any, res: any) => {
          const duration =
            Date.now() - ((req as any).__proxyStartTime || startTime);
          this.logger.error(
            `${req.method} ${fullPath} -> ERROR (${duration}ms): ${err.message}`,
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

    // Create and execute proxy middleware
    const proxy = createProxyMiddleware(options);
    // Proxy middleware handles req/res directly
    // When using @Res() decorator in NestJS, we must handle response manually
    // Provide a no-op next function since proxy handles everything
    proxy(req, res, () => {
      // This should never be called as proxy handles the response
      // But it's required by the middleware signature
    });
  }

  /**
   * Match route pattern to request path
   */
  private matchRoute(path: string, pattern: string): boolean {
    const pathParts = path.split("/").filter(Boolean);
    const patternParts = pattern.split("/").filter(Boolean);

    if (pathParts.length < patternParts.length) {
      return false;
    }

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
   */
  private findMatchingRoute(path: string): RouteConfig | null {
    // Sort routes by specificity (longer paths first)
    const sortedRoutes = [...PROXY_ROUTES].sort(
      (a, b) => b.path.length - a.path.length,
    );

    for (const route of sortedRoutes) {
      if (this.matchRoute(path, route.path)) {
        return route;
      }
    }

    return null;
  }
}
