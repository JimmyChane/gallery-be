import { getString, MaybeUndefined } from '@chanzor/utils';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService, JwtAccessPayload } from '../auth.service';
import { AuthUserStateEnum } from '../enum/auth-user-state.enum';

@Injectable()
export class AuthAccessTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken?.length) throw new UnauthorizedException('Access token missing');

    try {
      const payloadJwt: MaybeUndefined<Partial<JwtAccessPayload>> = await this.jwtService.verifyAsync(accessToken);
      const userIdJwt = getString(payloadJwt.userId);

      if (!userIdJwt?.length) throw new UnauthorizedException('Invalid token payload');

      const state = await this.authService.getUserState(userIdJwt);
      if (state !== AuthUserStateEnum.ACTIVE) {
        throw new UnauthorizedException('Session expired or user logged out');
      }

      request['user'] = payloadJwt;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      if (e instanceof Error) throw new UnauthorizedException(e.message);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
