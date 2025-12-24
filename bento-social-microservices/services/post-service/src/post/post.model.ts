import { z } from 'zod';
import { PublicUser, Topic } from '@bento/shared';

export enum PostType {
  TEXT = 'text',
  MEDIA = 'media',
}

// Business errors
export const ErrPostNotFound = new Error('Post not found');
export const ErrAuthorNotFound = new Error('Author not found');
export const ErrTopicNotFound = new Error('Topic not found');
export const ErrForbidden = new Error('You do not have permission to perform this action');
export const ErrMinContent = (num: number) => new Error(`The content must be at least ${num} characters`);
export const ErrURLInvalid = new Error('Invalid URL');

// Data model schema
export const postSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, { message: 'Content is required' }),
  image: z.string().optional(),
  authorId: z.string().uuid(),
  topicId: z.string().uuid(),
  isFeatured: z.boolean().default(false),
  commentCount: z.number().int().nonnegative().default(0),
  likedCount: z.number().int().nonnegative().default(0),
  type: z.nativeEnum(PostType).default(PostType.TEXT),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface Post extends z.infer<typeof postSchema> {
  topic?: Topic;
  author?: PublicUser;
  hasLiked?: boolean;
  hasSaved?: boolean;
}

export type PublicPost = Post;

