import { z } from 'zod';

export enum TopicStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

// Business errors
export const ErrTopicNotFound = new Error('Topic not found');
export const ErrTopicNameExists = new Error('Topic name already exists');
export const ErrForbidden = new Error('You do not have permission to perform this action');

// Data model schema
export const topicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().min(4).max(20),
  postCount: z.number().int().nonnegative().default(0),
  status: z.nativeEnum(TopicStatus).default(TopicStatus.ACTIVE),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface Topic extends z.infer<typeof topicSchema> {}

// Public Topic (same as Topic for now, but can be extended)
export type PublicTopic = Omit<Topic, 'status'>;

