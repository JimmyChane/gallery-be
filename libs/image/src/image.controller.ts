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

  @Get('/one/:filename')
  @CacheControl({ maxAge: 604_800, public: true })
  @Expires(604_800)
  async streamOneV2(
    @Param('filename') filename: unknown,
    @Query('w') width: unknown,
    @Query('h') height: unknown,
    @Res() response: Response,
  ): Promise<void> {
    if (typeof filename !== 'string') {
      throw new BadRequestException('Invalid filename');
    }

    if (typeof width !== 'string' && typeof width !== 'number' && width !== undefined) {
      throw new BadRequestException('Invalid width');
    }
    if (typeof height !== 'string' && typeof height !== 'number' && height !== undefined) {
      throw new BadRequestException('Invalid height');
    }

    await benchmark(this.logger, 'streamOne', async () => {
      await this.imageService.streamOne(
        { filename, width, height },
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
