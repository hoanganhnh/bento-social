import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ITokenIntrospect } from '../interfaces/requester.interface';

export const TOKEN_INTROSPECTOR = Symbol('TOKEN_INTROSPECTOR');

@Injectable()
export class RemoteAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_INTROSPECTOR) private readonly introspector: ITokenIntrospect,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const { payload, error, isOk } = await this.introspector.introspect(token);

      if (!isOk || !payload) {
        throw new UnauthorizedException(error?.message || 'Invalid token');
      }

      request['requester'] = payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Token validation failed');
    }

    return true;
  }
}

@Injectable()
export class RemoteAuthGuardOptional implements CanActivate {
  constructor(
    @Inject(TOKEN_INTROSPECTOR) private readonly introspector: ITokenIntrospect,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);

    if (!token) {
      return true;
    }

    try {
      const { payload, isOk } = await this.introspector.introspect(token);

      if (isOk && payload) {
        request['requester'] = payload;
      }
    } catch {
      // Ignore errors for optional auth
    }

    return true;
  }
}

function extractTokenFromHeader(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}


