import z from 'zod';

export const ErrTopicNotFound = new Error('Topic not found');
export const ErrTopicNameInvalid = new Error(
  'Topic name must be at least 3 characters',
);
export const ErrTopicNameAlreadyExists = new Error('Topic name already exists');
export const ErrTopicColorInvalid = new Error('Invalid hex color code');

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

export type Topic = z.infer<typeof topicSchema>;

export const createTopicDTOSchema = topicSchema.pick({
  name: true,
  color: true,
});

export type CreateTopicDTO = z.infer<typeof createTopicDTOSchema>;

export const updateTopicDTOSchema = topicSchema
  .pick({
    name: true,
    color: true,
  })
  .partial();

export type UpdateTopicDTO = z.infer<typeof updateTopicDTOSchema>;
