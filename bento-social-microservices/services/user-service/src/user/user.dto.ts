import { z } from 'zod';
import { Status } from './user.model';
import { UserRole } from '@bento/shared';

// Update DTO
export const userUpdateDTOSchema = z.object({
  avatar: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  bio: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(Status).optional(),
});

export interface UserUpdateDTO extends z.infer<typeof userUpdateDTOSchema> {}

// Condition DTO for queries
export const userCondDTOSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(Status).optional(),
});

export interface UserCondDTO extends z.infer<typeof userCondDTOSchema> {}


