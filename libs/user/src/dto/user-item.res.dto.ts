import { ApiProperty } from '@nestjs/swagger';

export class UserItemResDto {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  username!: string;
}
