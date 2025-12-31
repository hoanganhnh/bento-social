import z from 'zod';

export enum BaseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BANNED = 'banned',
  DELETED = 'deleted',
}

export enum PostType {
  TEXT = 'text',
  MEDIA = 'media',
}

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatar: z.string().nullable().optional(),
});

export interface PublicUser extends z.infer<typeof publicUserSchema> {}

export const topicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  postCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface Topic extends z.infer<typeof topicSchema> {}

export const postSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  author: publicUserSchema.optional(),
  content: z.string().min(1),
  image: z.string().optional(),
  topicId: z.string().uuid(),
  topic: topicSchema.optional(),
  isFeatured: z.boolean().default(false),
  commentCount: z.number().int().nonnegative().default(0),
  likedCount: z.number().int().nonnegative().default(0),
  type: z.nativeEnum(PostType),
  hasLiked: z.boolean().optional(),
  hasSaved: z.boolean().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export interface Post extends z.infer<typeof postSchema> {}


