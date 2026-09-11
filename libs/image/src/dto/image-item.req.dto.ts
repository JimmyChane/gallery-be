import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ImageItemReqDto {
  @ApiPropertyOptional({ description: 'Target image width (in pixels)', example: '300', type: String })
  @IsOptional()
  @IsString()
  w?: string;

  @ApiPropertyOptional({ description: 'Target image height (in pixels)', example: '200', type: String })
  @IsOptional()
  @IsString()
  h?: string;
}
