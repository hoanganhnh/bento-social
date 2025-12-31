import { Options } from "http-proxy-middleware";

export interface ServiceTarget {
  name: string;
  url: string;
  pathPrefix: string;
}

/**
 * Service targets configuration
 * Each service has a base URL and path prefix for routing
 */
export const SERVICE_TARGETS: Record<string, ServiceTarget> = {
  AUTH: {
    name: "auth-service",
    url: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    pathPrefix: "/v1",
  },
  USER: {
    name: "user-service",
    url: process.env.USER_SERVICE_URL || "http://localhost:3002",
    pathPrefix: "/v1",
  },
  POST: {
    name: "post-service",
    url: process.env.POST_SERVICE_URL || "http://localhost:3003",
    pathPrefix: "/v1",
  },
  TOPIC: {
    name: "topic-service",
    url: process.env.TOPIC_SERVICE_URL || "http://localhost:3004",
    pathPrefix: "/v1",
  },
  COMMENT: {
    name: "comment-service",
    url: process.env.COMMENT_SERVICE_URL || "http://localhost:3005",
    pathPrefix: "/v1",
  },
  NOTIFICATION: {
    name: "notification-service",
    url: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006",
    pathPrefix: "/v1",
  },
  UPLOAD: {
    name: "upload-service",
    url: process.env.UPLOAD_SERVICE_URL || "http://localhost:3007",
    pathPrefix: "/v1",
  },
  INTERACTION: {
    name: "interaction-service",
    url: process.env.INTERACTION_SERVICE_URL || "http://localhost:3008",
    pathPrefix: "/v1",
  },
};

/**
 * Route configuration for http-proxy-middleware
 * Routes are matched in order - more specific routes should come first
 */
export interface RouteConfig {
  /** Route path pattern (supports wildcards) */
  path: string;
  /** Target service key from SERVICE_TARGETS */
  service: keyof typeof SERVICE_TARGETS;
  /** Path rewrite rules */
  pathRewrite?: Record<string, string>;
  /** Whether to change the origin header */
  changeOrigin?: boolean;
  /** Custom timeout for this route (ms) */
  timeout?: number;
}

export const PROXY_ROUTES: RouteConfig[] = [
  // ============ AUTH SERVICE ============
  { path: "/v1/register", service: "AUTH", pathRewrite: { "^/v1": "" } },
  { path: "/v1/authenticate", service: "AUTH", pathRewrite: { "^/v1": "" } },
  { path: "/v1/profile", service: "AUTH", pathRewrite: { "^/v1": "" } },
  { path: "/v1/rpc/introspect", service: "AUTH", pathRewrite: { "^/v1": "" } },

  // ============ USER SERVICE ============
  {
    path: "/v1/users-suggested",
    service: "USER",
    pathRewrite: { "^/v1/users-suggested": "/users/suggested" },
  },
  {
    path: "/v1/rpc/users/by-ids",
    service: "USER",
    pathRewrite: { "^/v1": "" },
  },
  { path: "/v1/rpc/users/find", service: "USER", pathRewrite: { "^/v1": "" } },
  { path: "/v1/rpc/users", service: "USER", pathRewrite: { "^/v1": "" } },

  // ============ INTERACTION SERVICE (route before USER to match :id patterns) ============
  {
    path: "/v1/users/:id/saved-posts",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/users/:id/follow",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/users/:id/unfollow",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/users/:id/has-followed",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/users/:id/followers",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/users/:id/followings",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },

  // User service routes (after interaction routes)
  { path: "/v1/users", service: "USER", pathRewrite: { "^/v1": "" } },

  // ============ POST SERVICE ============
  { path: "/v1/posts/rpc", service: "POST", pathRewrite: { "^/v1": "" } },

  // ============ INTERACTION SERVICE (Post interactions) ============
  {
    path: "/v1/posts/:id/like",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/posts/:id/unlike",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/posts/:id/save",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/posts/:id/unsave",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/posts/:id/liked-users",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },

  // RPC Interaction routes
  {
    path: "/v1/rpc/has-liked",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/rpc/list-post-ids-liked",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/rpc/has-saved",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/rpc/list-post-ids-saved",
    service: "INTERACTION",
    pathRewrite: { "^/v1": "" },
  },

  // Post service routes (after interaction routes)
  { path: "/v1/posts", service: "POST", pathRewrite: { "^/v1": "" } },

  // ============ TOPIC SERVICE ============
  { path: "/v1/rpc/topics", service: "TOPIC", pathRewrite: { "^/v1": "" } },
  { path: "/v1/topics", service: "TOPIC", pathRewrite: { "^/v1": "" } },

  // ============ COMMENT SERVICE ============
  {
    path: "/v1/posts/:postId/comments",
    service: "COMMENT",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/comments/:id/replies",
    service: "COMMENT",
    pathRewrite: { "^/v1": "" },
  },
  { path: "/v1/comments", service: "COMMENT", pathRewrite: { "^/v1": "" } },

  // ============ NOTIFICATION SERVICE ============
  {
    path: "/v1/notifications/:id/read",
    service: "NOTIFICATION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/notifications/read-all",
    service: "NOTIFICATION",
    pathRewrite: { "^/v1": "" },
  },
  {
    path: "/v1/notifications",
    service: "NOTIFICATION",
    pathRewrite: { "^/v1": "" },
  },

  // ============ UPLOAD SERVICE ============
  {
    path: "/v1/upload-file",
    service: "UPLOAD",
    pathRewrite: { "^/v1": "" },
    timeout: 60000, // 60s timeout for file uploads
  },
  { path: "/v1/uploads", service: "UPLOAD", pathRewrite: { "^/v1": "" } },
];

/**
 * Get base proxy options for http-proxy-middleware
 */
export function getProxyOptions(
  target: string,
  pathRewrite?: Record<string, string>,
): Options {
  return {
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Forward relevant headers
        const forwardHeaders = [
          "authorization",
          "x-request-id",
          "x-correlation-id",
        ];
        forwardHeaders.forEach((header) => {
          const value = req.headers[header];
          if (value && typeof value === "string") {
            proxyReq.setHeader(header, value);
          }
        });
      },
      proxyRes: (proxyRes, req, res) => {
        // Add CORS headers if not present
        if (!proxyRes.headers["access-control-allow-origin"]) {
          proxyRes.headers["access-control-allow-origin"] = "*";
        }
      },
      error: (err, req, res) => {
        console.error(`Proxy error: ${err.message}`);
        if (res && "writeHead" in res && typeof res.writeHead === "function") {
          (res as any).writeHead(502, { "Content-Type": "application/json" });
          (res as any).end(
            JSON.stringify({
              statusCode: 502,
              message: "Bad Gateway",
              error: "Service unavailable",
            }),
          );
        }
      },
    },
  };
}

