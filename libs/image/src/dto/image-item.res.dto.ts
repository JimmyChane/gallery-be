import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImageItemResDto {
  @ApiProperty({ example: 'fur-gear-mylo.webp' })
  @IsString()
  @IsNotEmpty()
  filename!: string;
}
