import { AuthAccessTokenGuard } from '@app/auth/guard/auth-access-token.guard';
import { Controller, UseGuards } from '@nestjs/common';

@Controller()
@UseGuards(AuthAccessTokenGuard)
export class AppController {
  constructor() {}
}
