import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Requester } from '../interfaces/requester.interface';

export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Requester => {
    const request = ctx.switchToHttp().getRequest();
    return request['requester'];
  },
);

