import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as bodyParser from "body-parser";

import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";
import {
  cacheMiddleware,
  cacheInvalidationMiddleware,
} from "./middleware/cache.middleware";

import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    }),
  );

  // ============ CORS Configuration ============
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:5173"];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || process.env.CORS_ORIGINS === "*") {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "X-Correlation-ID",
      "Accept",
    ],
    exposedHeaders: [
      "X-Request-ID",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
      "X-Cache",
      "X-Cache-TTL",
      "X-Served-By",
    ],
    maxAge: 86400, // 24 hours
  });

  // ============ Body Parsing ============
  // Configure body parser with raw body capture for signature verification
  const rawBodyBuffer = (req: any, res: any, buf: Buffer, encoding: string) => {
    if (buf && buf.length) {
      req.rawBody = buf;
    }
  };

  // Parse JSON bodies (but not for multipart or /v1 routes which will be proxied)
  app.use((req: any, res: any, next: any) => {
    const contentType = req.headers["content-type"] || "";
    // Skip body parsing for multipart or proxied routes
    if (
      contentType.includes("multipart/form-data") ||
      req.path.startsWith("/v1")
    ) {
      // Skip body parsing - let proxy handle it
      return next();
    }
    bodyParser.json({ verify: rawBodyBuffer, limit: "10mb" })(req, res, next);
  });

  app.use((req: any, res: any, next: any) => {
    const contentType = req.headers["content-type"] || "";
    // Skip body parsing for multipart or proxied routes
    if (
      contentType.includes("multipart/form-data") ||
      req.path.startsWith("/v1")
    ) {
      return next();
    }
    bodyParser.urlencoded({
      verify: rawBodyBuffer,
      extended: true,
      limit: "10mb",
    })(req, res, next);
  });

  // ============ Rate Limiting ============
  app.use(rateLimitMiddleware);

  // ============ Response Caching ============
  // Cache GET requests
  app.use((req: any, res: any, next: any) => {
    if (req.method === "GET") {
      return cacheMiddleware(req, res, next);
    }
    next();
  });

  // Invalidate cache on write operations
  app.use((req: any, res: any, next: any) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return cacheInvalidationMiddleware(req, res, next);
    }
    next();
  });

  // ============ Request Logging ============
  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers["x-request-id"] || generateRequestId();
    req.headers["x-request-id"] = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
  });

  // ============ Start Server ============
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 API Gateway is running on: http://localhost:${port}`,
    "Bootstrap",
  );
  Logger.log(`🛡️  Security: Helmet enabled`, "Bootstrap");
  Logger.log(`⚡ Rate limiting: Enabled`, "Bootstrap");
  Logger.log(`📦 Response caching: Enabled`, "Bootstrap");
  Logger.log(`📡 Proxying requests to microservices...`, "Bootstrap");
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

bootstrap();
