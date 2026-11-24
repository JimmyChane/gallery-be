import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthRefreshReqDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey',
    type: 'string',
    required: true,
  })
  @IsString()
  refreshToken!: string;
}
