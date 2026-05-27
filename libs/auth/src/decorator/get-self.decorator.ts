import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAccessPayload } from '../auth.service';

export const GetSelf = createParamDecorator((data: unknown, ctx: ExecutionContext): Partial<JwtAccessPayload> => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
