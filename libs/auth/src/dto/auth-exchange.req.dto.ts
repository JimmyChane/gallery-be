import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthExchangeReqDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey',
    type: 'string',
    required: true,
  })
  @IsString()
  loginToken!: string;
}
