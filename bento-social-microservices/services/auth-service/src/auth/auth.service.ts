import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v7 } from 'uuid';
import { AppError, TokenPayload, UserRole } from '@bento/shared';
import { USER_REPOSITORY, TOKEN_PROVIDER } from './auth.di-token';
import { IAuthService, IUserRepository, ITokenProvider } from './auth.port';
import {
  UserLoginDTO,
  userLoginDTOSchema,
  UserRegistrationDTO,
  userRegistrationDTOSchema,
  UserUpdateProfileDTO,
  userUpdateProfileDTOSchema,
} from './auth.dto';
import {
  User,
  Status,
  ErrUsernameExisted,
  ErrInvalidUsernameAndPassword,
  ErrUserInactivated,
  ErrInvalidToken,
  ErrUserNotFound,
} from './user.model';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: ITokenProvider,
  ) {}

  async register(dto: UserRegistrationDTO): Promise<string> {
    const data = userRegistrationDTOSchema.parse(dto);

    // 1. Check username existed
    const existingUser = await this.userRepo.findByCond({ username: data.username });
    if (existingUser) {
      throw AppError.from(ErrUsernameExisted, 400);
    }

    // 2. Generate salt and hash password
    const salt = bcrypt.genSaltSync(8);
    const hashPassword = await bcrypt.hash(`${data.password}.${salt}`, 10);

    // 3. Create new user
    const newId = v7();
    const newUser: User = {
      id: newId,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashPassword,
      salt: salt,
      role: UserRole.USER,
      status: Status.ACTIVE,
      avatar: null,
      cover: null,
      bio: null,
      websiteUrl: null,
      followerCount: 0,
      postCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Insert new user to database
    await this.userRepo.insert(newUser);

    return newId;
  }

  async login(dto: UserLoginDTO): Promise<string> {
    const data = userLoginDTOSchema.parse(dto);

    // 1. Find user with username
    const user = await this.userRepo.findByCond({ username: data.username });
    if (!user) {
      throw AppError.from(ErrInvalidUsernameAndPassword, 400).withLog('Username not found');
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(`${data.password}.${user.salt}`, user.password);
    if (!isMatch) {
      throw AppError.from(ErrInvalidUsernameAndPassword, 400).withLog('Password is incorrect');
    }

    // 3. Check user status
    if (user.status === Status.DELETED || user.status === Status.INACTIVE) {
      throw AppError.from(ErrUserInactivated, 400);
    }

    // 4. Generate and return token
    const token = await this.tokenProvider.generateToken({
      sub: user.id,
      role: user.role,
    });

    return token;
  }

  async profile(userId: string): Promise<Omit<User, 'password' | 'salt'>> {
    const user = await this.userRepo.get(userId);

    if (!user) {
      throw AppError.from(ErrUserNotFound, 404);
    }

    const { password, salt, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, dto: UserUpdateProfileDTO): Promise<void> {
    const data = userUpdateProfileDTOSchema.parse(dto);

    const user = await this.userRepo.get(userId);
    if (!user) {
      throw AppError.from(ErrUserNotFound, 404);
    }

    // If password is being updated, hash it
    if (data.password) {
      const salt = bcrypt.genSaltSync(8);
      const hashPassword = await bcrypt.hash(`${data.password}.${salt}`, 10);
      await this.userRepo.update(userId, {
        ...data,
        password: hashPassword,
        salt: salt,
      });
    } else {
      await this.userRepo.update(userId, data);
    }
  }

  async introspectToken(token: string): Promise<TokenPayload> {
    const payload = await this.tokenProvider.verifyToken(token);

    if (!payload) {
      throw AppError.from(ErrInvalidToken, 400);
    }

    // Verify user still exists and is active
    const user = await this.userRepo.get(payload.sub);
    if (!user) {
      throw AppError.from(ErrUserNotFound, 400);
    }

    if (
      user.status === Status.DELETED ||
      user.status === Status.INACTIVE ||
      user.status === Status.BANNED
    ) {
      throw AppError.from(ErrUserInactivated, 400);
    }

    return {
      sub: user.id,
      role: user.role,
    };
  }
}

