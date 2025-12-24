export const SERVICES_CONFIG = Symbol('SERVICES_CONFIG');

export interface IServicesConfig {
  AUTH: string;
  USER: string;
  POST: string;
  TOPIC: string;
  COMMENT: string;
  NOTIFICATION: string;
  UPLOAD: string;
  INTERACTION: string;
}

export const ServicesConfig: IServicesConfig = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  USER: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  POST: process.env.POST_SERVICE_URL || 'http://localhost:3003',
  TOPIC: process.env.TOPIC_SERVICE_URL || 'http://localhost:3004',
  COMMENT: process.env.COMMENT_SERVICE_URL || 'http://localhost:3005',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  UPLOAD: process.env.UPLOAD_SERVICE_URL || 'http://localhost:3007',
  INTERACTION: process.env.INTERACTION_SERVICE_URL || 'http://localhost:3008',
};

// Route mapping configuration
export interface RouteMapping {
  path: string;
  service: keyof IServicesConfig;
  targetPath?: string; // Optional: rewrite path
  methods?: string[];
}

export const ROUTE_MAPPINGS: RouteMapping[] = [
  // ============ AUTH SERVICE ============
  { path: '/v1/register', service: 'AUTH', targetPath: '/register' },
  { path: '/v1/authenticate', service: 'AUTH', targetPath: '/authenticate' },
  { path: '/v1/profile', service: 'AUTH', targetPath: '/profile' },
  { path: '/v1/rpc/introspect', service: 'AUTH', targetPath: '/rpc/introspect' },

  // ============ USER SERVICE ============
  { path: '/v1/users-suggested', service: 'USER', targetPath: '/users-suggested' },
  { path: '/v1/users/:id', service: 'USER', targetPath: '/users/:id' },
  { path: '/v1/rpc/users', service: 'USER', targetPath: '/rpc/users' },

  // ============ POST SERVICE ============
  { path: '/v1/posts/rpc', service: 'POST', targetPath: '/posts/rpc' },
  { path: '/v1/posts/:id', service: 'POST', targetPath: '/posts/:id' },
  { path: '/v1/posts', service: 'POST', targetPath: '/posts' },

  // ============ TOPIC SERVICE ============
  { path: '/v1/topics/:id', service: 'TOPIC', targetPath: '/topics/:id' },
  { path: '/v1/topics', service: 'TOPIC', targetPath: '/topics' },
  { path: '/v1/rpc/topics', service: 'TOPIC', targetPath: '/rpc/topics' },

  // ============ COMMENT SERVICE ============
  { path: '/v1/posts/:postId/comments', service: 'COMMENT', targetPath: '/posts/:postId/comments' },
  { path: '/v1/comments/:id/replies', service: 'COMMENT', targetPath: '/comments/:id/replies' },
  { path: '/v1/comments/:id', service: 'COMMENT', targetPath: '/comments/:id' },

  // ============ INTERACTION SERVICE (Like, Save, Follow) ============
  { path: '/v1/posts/:id/like', service: 'INTERACTION', targetPath: '/posts/:id/like' },
  { path: '/v1/posts/:id/unlike', service: 'INTERACTION', targetPath: '/posts/:id/unlike' },
  { path: '/v1/posts/:id/save', service: 'INTERACTION', targetPath: '/posts/:id/save' },
  { path: '/v1/posts/:id/unsave', service: 'INTERACTION', targetPath: '/posts/:id/unsave' },
  { path: '/v1/posts/:id/liked-users', service: 'INTERACTION', targetPath: '/posts/:id/liked-users' },
  { path: '/v1/users/:id/follow', service: 'INTERACTION', targetPath: '/users/:id/follow' },
  { path: '/v1/users/:id/unfollow', service: 'INTERACTION', targetPath: '/users/:id/unfollow' },
  { path: '/v1/users/:id/has-followed', service: 'INTERACTION', targetPath: '/users/:id/has-followed' },
  { path: '/v1/users/:id/followers', service: 'INTERACTION', targetPath: '/users/:id/followers' },
  { path: '/v1/users/:id/followings', service: 'INTERACTION', targetPath: '/users/:id/followings' },
  { path: '/v1/rpc/has-liked', service: 'INTERACTION', targetPath: '/rpc/has-liked' },
  { path: '/v1/rpc/list-post-ids-liked', service: 'INTERACTION', targetPath: '/rpc/list-post-ids-liked' },
  { path: '/v1/rpc/has-saved', service: 'INTERACTION', targetPath: '/rpc/has-saved' },
  { path: '/v1/rpc/list-post-ids-saved', service: 'INTERACTION', targetPath: '/rpc/list-post-ids-saved' },

  // ============ NOTIFICATION SERVICE ============
  { path: '/v1/notifications/:id/read', service: 'NOTIFICATION', targetPath: '/notifications/:id/read' },
  { path: '/v1/notifications/read-all', service: 'NOTIFICATION', targetPath: '/notifications/read-all' },
  { path: '/v1/notifications', service: 'NOTIFICATION', targetPath: '/notifications' },

  // ============ UPLOAD SERVICE ============
  { path: '/v1/uploads', service: 'UPLOAD', targetPath: '/uploads' },
];

