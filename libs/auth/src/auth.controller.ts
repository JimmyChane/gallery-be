import { UserService } from '@app/user/user.service';
import { Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { AuthService, JwtAccessPayload } from './auth.service';
import { GetSelf } from './decorator/get-self.decorator';
import { AuthExchangeReqDto } from './dto/auth-exchange.req.dto';
import { AuthLoginReqDto } from './dto/auth-login.req.dto';
import { AuthAccessResDto, AuthLoginResDto } from './dto/auth-login.res.dto';
import { AuthRefreshReqDto } from './dto/auth-refresh.req.dto';
import { AuthSelfResDto } from './dto/auth-self.res.dto';
import { AuthAccessTokenGuard } from './guard/auth-access-token.guard';

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() body: AuthLoginReqDto): Promise<AuthLoginResDto> {
    return this.authService.login(body);
  }

  @Post('exchange')
  async exchange(@Body() body: AuthExchangeReqDto): Promise<AuthAccessResDto> {
    return this.authService.exchangeLoginToken(body);
  }

  @Post('refresh')
  async refresh(@Body() body: AuthRefreshReqDto): Promise<AuthAccessResDto> {
    return this.authService.refreshTokens(body);
  }

  @UseGuards(AuthAccessTokenGuard)
  @Get('self')
  async self(@GetSelf() self: JwtAccessPayload): Promise<AuthSelfResDto> {
    const userDocument = await this.userService.findOneById(self.userId);
    if (!userDocument) {
      throw new NotFoundException(`user ${self.userId} not found`);
    }

    return { id: userDocument?._id.toString(), username: userDocument?.username };
  }
}
