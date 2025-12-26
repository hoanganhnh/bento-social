import { UserRole } from '@bento/shared';
import { z } from 'zod';

export enum Status {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  DELETED = 'deleted',
}

// Business errors
export const ErrUserNotFound = new Error('User not found');
export const ErrForbidden = new Error('You do not have permission to perform this action');

// Data model schema
export const userSchema = z.object({
  id: z.string().uuid(),
  avatar: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  username: z.string().min(3).max(25),
  password: z.string(),
  salt: z.string(),
  bio: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  followerCount: z.number().default(0),
  postCount: z.number().default(0),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(Status).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface User extends z.infer<typeof userSchema> {}

export type PublicUser = Omit<User, 'password' | 'salt'>;


