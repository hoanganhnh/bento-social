import { z } from 'zod';
import { userSchema, Status } from './user.model';
import { UserRole } from '@bento/shared';

// Registration DTO
export const userRegistrationDTOSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(25, 'Username must be at most 25 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers and underscore (_)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export interface UserRegistrationDTO extends z.infer<typeof userRegistrationDTOSchema> {}

// Login DTO
export const userLoginDTOSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export interface UserLoginDTO extends z.infer<typeof userLoginDTOSchema> {}

// Update DTO
export const userUpdateDTOSchema = z.object({
  avatar: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  bio: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  salt: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(Status).optional(),
});

export interface UserUpdateDTO extends z.infer<typeof userUpdateDTOSchema> {}

// Update Profile DTO (excludes role and status)
export const userUpdateProfileDTOSchema = userUpdateDTOSchema.omit({
  role: true,
  status: true,
  salt: true,
});

export interface UserUpdateProfileDTO extends z.infer<typeof userUpdateProfileDTOSchema> {}

// Condition DTO for queries
export const userCondDTOSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(Status).optional(),
});

export interface UserCondDTO extends z.infer<typeof userCondDTOSchema> {}


