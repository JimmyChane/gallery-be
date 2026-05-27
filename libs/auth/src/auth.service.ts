import { RedisService } from '@app/redis/redis.service';
import { UserService } from '@app/user/user.service';
import { getString, MaybeUndefined, parseUnknownEnum } from '@chanzor/utils';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthExchangeReqDto } from './dto/auth-exchange.req.dto';
import { AuthLoginReqDto } from './dto/auth-login.req.dto';
import { AuthAccessResDto, AuthLoginResDto } from './dto/auth-login.res.dto';
import { AuthRefreshReqDto } from './dto/auth-refresh.req.dto';
import { AuthUserStateEnum } from './enum/auth-user-state.enum';

export type JwtLoginPayload = { type: 'login'; userId: string; username: string };
export type JwtRefreshPayload = { type: 'refresh'; userId: string; username: string };
export type JwtAccessPayload = { userId: string; username: string };

@Injectable()
export class AuthService {
  private readonly ACCESS_SESSION_TTL = 300; // 5 minutes
  private readonly REFRESH_SESSION_TTL = 330; // 5.5 minutes

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  private getSessionKey(userId: string): string {
    return `auth:session:${userId}`;
  }

  private async setUserState(userId: string, state: AuthUserStateEnum): Promise<void> {
    const client = await this.redisService.getClient();
    await client.set(this.getSessionKey(userId), state, 'EX', this.ACCESS_SESSION_TTL);
  }

  async getUserState(userId: string): Promise<AuthUserStateEnum | undefined> {
    const client = await this.redisService.getClient();
    const value = await client.get(this.getSessionKey(userId));
    return parseUnknownEnum(value, Object.values(AuthUserStateEnum));
  }

  async login(payload: AuthLoginReqDto): Promise<AuthLoginResDto> {
    const user = await this.userService.findOneByUsername(payload.username);
    if (!user) throw new UnauthorizedException();

    const isMatched = await this.userService.comparePassword(payload.password, user.password);
    if (!isMatched) throw new UnauthorizedException();

    const payloadJwt: JwtLoginPayload = { type: 'login', userId: user._id.toString(), username: payload.username };
    const loginToken = this.jwtService.sign(payloadJwt, { expiresIn: '30s' });
    return { loginToken };
  }

  async exchangeLoginToken(payload: AuthExchangeReqDto): Promise<AuthAccessResDto> {
    try {
      const payloadJwt = await this.jwtService.verifyAsync<JwtLoginPayload>(payload.loginToken);
      const userIdJwt = getString(payloadJwt.userId);
      const usernameJwt = getString(payloadJwt.username);

      if (payloadJwt?.type !== 'login') throw new UnauthorizedException('Invalid token type');
      if (!userIdJwt?.length || !usernameJwt?.length) throw new UnauthorizedException('Invalid payload');

      await this.setUserState(userIdJwt, AuthUserStateEnum.ACTIVE);

      return this.generateTokenPair(userIdJwt, userIdJwt);
    } catch (e) {
      throw new UnauthorizedException('Login token expired or invalid');
    }
  }

  async refreshTokens(payload: AuthRefreshReqDto): Promise<AuthAccessResDto> {
    try {
      const payloadJwt: JwtRefreshPayload = this.jwtService.verify(payload.refreshToken);
      if (payloadJwt.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

      const userId = payloadJwt.userId;

      const currentState = await this.getUserState(userId);

      if (currentState === AuthUserStateEnum.LOGOUT) throw new UnauthorizedException('Session expired or logged out');

      await this.setUserState(userId, AuthUserStateEnum.ACTIVE);

      return this.generateTokenPair(userId, payloadJwt.username);
    } catch (e) {
      throw new UnauthorizedException('Refresh token invalid or session expired');
    }
  }

  private generateTokenPair(userId: string, username: string): AuthAccessResDto {
    const jwtAccessPayload: JwtAccessPayload = { userId, username };
    const jwtRefreshPayload: JwtRefreshPayload = { type: 'refresh', userId, username };

    return {
      accessToken: this.jwtService.sign(jwtAccessPayload, { expiresIn: `${this.ACCESS_SESSION_TTL}s` }),
      refreshToken: this.jwtService.sign(jwtRefreshPayload, { expiresIn: `${this.REFRESH_SESSION_TTL}s` }),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.setUserState(userId, AuthUserStateEnum.LOGOUT);
  }

  async verifyAccessToken(accessToken: string): Promise<Partial<JwtAccessPayload>> {
    const payloadJwt: MaybeUndefined<Partial<JwtAccessPayload>> = await this.jwtService.verifyAsync(accessToken);
    return payloadJwt;
  }
}
