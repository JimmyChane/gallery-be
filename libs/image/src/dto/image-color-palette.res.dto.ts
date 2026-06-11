import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ImageColorPaletteResDto {
  @ApiPropertyOptional({ example: '#3a12ff', description: 'High saturation, balanced luminance' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'vibrant must be a valid hex color' })
  vibrant?: string;

  @ApiPropertyOptional({ example: '#1a0a80', description: 'High saturation, low luminance' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'darkVibrant must be a valid hex color' })
  vibrantDark?: string;

  @ApiPropertyOptional({ example: '#7a5cff', description: 'High saturation, high luminance' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'lightVibrant must be a valid hex color' })
  vibrantLight?: string;

  @ApiPropertyOptional({ example: '#4d4d4d', description: 'Low saturation, balanced luminance' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'muted must be a valid hex color' })
  muted?: string;

  @ApiPropertyOptional({ example: '#262626', description: 'Low saturation, low luminance' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'darkMuted must be a valid hex color' })
  mutedDark?: string;

  @ApiPropertyOptional({ example: '#d9d9d9', description: 'Low saturation, high luminance' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'lightMuted must be a valid hex color' })
  mutedLight?: string;
}
