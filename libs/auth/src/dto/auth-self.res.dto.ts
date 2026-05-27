import { ApiProperty } from '@nestjs/swagger';

export class AuthSelfResDto {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  username!: string;
}
