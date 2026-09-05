import { CacheControl } from '@/cache-control/cache-control.decorator';
import { Expires } from '@/expires/expires.decorator';
import { benchmark } from '@/util/benchmark';
import { AuthAccessTokenGuard } from '@app/auth/guard/auth-access-token.guard';
import { ImageService } from '@app/image/image.service';
import { BadRequestException, Controller, Get, Logger, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ImageColorPaletteResDto } from './dto/image-color-palette.res.dto';
import { ImageItemResDto } from './dto/image-item.res.dto';

@Controller()
@UseGuards(AuthAccessTokenGuard)
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(private readonly imageService: ImageService) {}

  @Get('/list')
  async getList(): Promise<ImageItemResDto[]> {
    return this.imageService.getList();
  }

  private parseDimension(value: unknown, context: string): number | undefined {
    if (typeof value === 'string' && value.trim().length < 0) value = undefined;

    if (typeof value === 'string') {
      value = Number.parseInt(value);
      if (Number.isNaN(value)) throw new BadRequestException(`Invalid ${context}`);
    }

    console.log('value', value);

    if (typeof value !== 'number' && value !== undefined) throw new BadRequestException(`Invalid ${context}`);

    if (typeof value === 'number' && value < 0) throw new BadRequestException(`Invalid ${context}`);

    return value;
  }

  @Get('/one/:filename')
  @CacheControl({ maxAge: 604_800, public: true })
  @Expires(604_800)
  async streamOneV2(
    @Param('filename') filename: unknown,
    @Query('w') width: unknown,
    @Query('h') height: unknown,
    @Res() response: Response,
  ): Promise<void> {
    if (typeof filename !== 'string') throw new BadRequestException('Invalid filename');
    if (filename.includes('/')) throw new BadRequestException('Invalid filename');
    const filenameParsed = decodeURIComponent(filename);

    const widthParsed = this.parseDimension(width, 'width');
    const heightParsed = this.parseDimension(height, 'height');

    await benchmark(this.logger, 'streamOne', async () => {
      await this.imageService.streamOne(
        { filename: filenameParsed, width: widthParsed, height: heightParsed },
        {
          contentType: (contentType: string) => response.contentType(contentType),
          write: (chunk: any) => response.write(chunk),
          end: () => response.end(),
        },
      );
    });
  }

  @Get('/one/:filename/palette')
  async getPallette(@Param('filename') filename: string): Promise<ImageColorPaletteResDto> {
    return benchmark(this.logger, 'getPallette', () => {
      return this.imageService.getOnePallette(filename);
    });
  }
}
