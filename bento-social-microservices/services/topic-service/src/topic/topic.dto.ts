import { z } from 'zod';
import { TopicStatus } from './topic.model';

// Create DTO
export const createTopicDTOSchema = z.object({
  name: z.string().min(1, 'Topic name is required').max(100),
  color: z.string().min(4, 'Color is required').max(20).default('#3B82F6'),
});

export interface CreateTopicDTO extends z.infer<typeof createTopicDTOSchema> {}

// Update DTO
export const updateTopicDTOSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().min(4).max(20).optional(),
  status: z.nativeEnum(TopicStatus).optional(),
});

export interface UpdateTopicDTO extends z.infer<typeof updateTopicDTOSchema> {}

// Query DTO for listing
export const topicQueryDTOSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(TopicStatus).optional(),
  search: z.string().optional(),
});

export interface TopicQueryDTO extends z.infer<typeof topicQueryDTOSchema> {}

// Condition DTO for queries
export const topicCondDTOSchema = z.object({
  name: z.string().optional(),
  status: z.nativeEnum(TopicStatus).optional(),
});

export interface TopicCondDTO extends z.infer<typeof topicCondDTOSchema> {}

