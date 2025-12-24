import { z } from 'zod';
import { PostType } from './post.model';

// Create DTO
export const createPostDTOSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  image: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
  topicId: z.string().uuid('Invalid topic ID'),
  authorId: z.string().uuid('Invalid author ID'),
});

export interface CreatePostDTO extends z.infer<typeof createPostDTOSchema> {}

// Update DTO
export const updatePostDTOSchema = z.object({
  content: z.string().min(1).optional(),
  image: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url().optional().nullable()
  ),
  topicId: z.string().uuid().optional(),
  isFeatured: z.boolean().optional(),
});

export interface UpdatePostDTO extends z.infer<typeof updatePostDTOSchema> {}

// Query DTO for listing
export const postQueryDTOSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  str: z.string().optional(), // search string
  userId: z.string().uuid().optional(), // filter by author
  topicId: z.string().uuid().optional(), // filter by topic
  isFeatured: z.preprocess(v => v === 'true', z.boolean()).optional(),
  type: z.nativeEnum(PostType).optional(),
});

export interface PostQueryDTO extends z.infer<typeof postQueryDTOSchema> {}

// Condition DTO for queries
export const postCondDTOSchema = z.object({
  str: z.string().optional(),
  userId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  isFeatured: z.boolean().optional(),
  type: z.nativeEnum(PostType).optional(),
});

export interface PostCondDTO extends z.infer<typeof postCondDTOSchema> {}

