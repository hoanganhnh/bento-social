import z from 'zod';
import { PublicUser, Topic } from 'src/share/data-model';

export const ErrPostNotFound = new Error('Post not found');
export const ErrAuthorNotFound = new Error('Author not found');
export const ErrTopicNotFound = new Error('Topic not found');
export const ErrMinContent = (num: number) =>
  new Error(`Content must be at least ${num} characters`);

export enum Type {
  TEXT = 'text',
  MEDIA = 'media',
}

export const postSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  image: z.string().optional(),
  authorId: z.string().uuid(),
  topicId: z.string().uuid(),
  isFeatured: z.boolean().optional().default(false),
  commentCount: z.number().int().nonnegative().default(0),
  likedCount: z.number().int().nonnegative().default(0),
  type: z.nativeEnum(Type),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
});

export type Post = z.infer<typeof postSchema> & {
  topic?: Topic;
  author?: PublicUser;
  hasLiked?: boolean;
  hasSaved?: boolean;
};

export const postCondDTOSchema = z.object({
  str: z.string().optional(),
  userId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  isFeatured: z.preprocess((v) => v === 'true', z.boolean()).optional(),
  type: z.nativeEnum(Type).optional(),
});

export type PostCondDTO = z.infer<typeof postCondDTOSchema>;

export const createPostDTOSchema = postSchema
  .pick({
    content: true,
    image: true,
    authorId: true,
    topicId: true,
  })
  .required();

export type CreatePostDTO = z.infer<typeof createPostDTOSchema>;

export const updatePostDTOSchema = postSchema
  .pick({
    content: true,
    image: true,
    topicId: true,
    isFeatured: true,
    type: true,
    updatedAt: true,
  })
  .partial();

export type UpdatePostDTO = z.infer<typeof updatePostDTOSchema>;

// Topic schema for this service
export const topicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  postCount: z.number().int().nonnegative().default(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/i)
    .default('#008000'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TopicModel = z.infer<typeof topicSchema>;
