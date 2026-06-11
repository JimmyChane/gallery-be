import { AuthAccessTokenGuard } from '@app/auth/guard/auth-access-token.guard';
import { UserService } from '@app/user/user.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserItemResDto } from './dto/user-item.res.dto';

@Controller()
@UseGuards(AuthAccessTokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/list')
  async getList(): Promise<UserItemResDto[]> {
    return this.userService.getList();
  }
}
