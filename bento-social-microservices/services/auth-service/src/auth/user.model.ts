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
export const ErrFirstNameAtLeast2Chars = new Error('First name must be at least 2 characters');
export const ErrLastNameAtLeast2Chars = new Error('Last name must be at least 2 characters');
export const ErrUsernameAtLeast3Chars = new Error('Username must be at least 3 characters');
export const ErrUsernameAtMost25Chars = new Error('Username must be at most 25 characters');
export const ErrUsernameInvalid = new Error('Username must contain only letters, numbers and underscore (_)');
export const ErrPasswordAtLeast6Chars = new Error('Password must be at least 6 characters');
export const ErrUsernameExisted = new Error('Username is already existed');
export const ErrInvalidUsernameAndPassword = new Error('Invalid username and password');
export const ErrUserInactivated = new Error('User is inactivated or banned');
export const ErrInvalidToken = new Error('Invalid token');
export const ErrUserNotFound = new Error('User not found');

// Data model schema
export const userSchema = z.object({
  id: z.string().uuid(),
  avatar: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  firstName: z.string().min(2, ErrFirstNameAtLeast2Chars.message),
  lastName: z.string().min(2, ErrLastNameAtLeast2Chars.message),
  username: z
    .string()
    .min(3, ErrUsernameAtLeast3Chars.message)
    .max(25, ErrUsernameAtMost25Chars.message)
    .regex(/^[a-zA-Z0-9_]+$/, ErrUsernameInvalid.message),
  password: z.string().min(6, ErrPasswordAtLeast6Chars.message),
  salt: z.string().min(8),
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


