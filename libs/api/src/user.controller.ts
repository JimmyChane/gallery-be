import { AuthAccessTokenGuard } from '@app/auth/guard/auth-access-token.guard';
import { UserItemResDto } from '@app/user/dto/user-item.res.dto';
import { UserService } from '@app/user/user.service';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('user')
@UseGuards(AuthAccessTokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/list')
  async getList(): Promise<UserItemResDto[]> {
    return this.userService.getList();
  }
}
