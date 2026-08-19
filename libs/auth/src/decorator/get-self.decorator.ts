import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { JwtAccessPayload } from '../auth.service';
import { AuthAccessTokenGuard } from '../guard/auth-access-token.guard';

export const GetSelf = createParamDecorator((data: unknown, ctx: ExecutionContext): Partial<JwtAccessPayload> => {
  const request = ctx.switchToHttp().getRequest();
  if (!request.user) {
    console.error(`Make sure use UseGuards(${AuthAccessTokenGuard.name}) before GetSelf()`);
    throw new InternalServerErrorException();
  }

  return request.user;
});
