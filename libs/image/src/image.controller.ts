import { CacheControl } from '@/cache-control/cache-control.decorator';
import { Expires } from '@/expires/expires.decorator';
import { benchmark } from '@/util/benchmark';
import { AuthAccessTokenGuard } from '@app/auth/guard/auth-access-token.guard';
import { ImageService } from '@app/image/image.service';
import { BadRequestException, Controller, Get, Logger, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { ImageColorPaletteResDto } from './dto/image-color-palette.res.dto';
import { ImageItemReqDto } from './dto/image-item.req.dto';
import { ImageItemResDto } from './dto/image-item.res.dto';

@Controller()
@UseGuards(AuthAccessTokenGuard)
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(private readonly imageService: ImageService) {}

  @Get('/list')
  @ApiOperation({ summary: 'List all available images', description: 'Retrieves a list of filenames for all stored images.' })
  @ApiOkResponse({ description: 'Successfully retrieved list of image filenames.', type: [ImageItemResDto] })
  async getList(): Promise<ImageItemResDto[]> {
    return this.imageService.getList();
  }

  private parseDimension(value: unknown, context: string): number | undefined {
    if (typeof value === 'string' && value.trim().length < 0) value = undefined;

    if (typeof value === 'string') {
      value = Number.parseInt(value);
      if (Number.isNaN(value)) throw new BadRequestException(`Invalid ${context}`);
    }

    if (typeof value !== 'number' && value !== undefined) throw new BadRequestException(`Invalid ${context}`);

    if (typeof value === 'number' && value < 0) throw new BadRequestException(`Invalid ${context}`);

    return value;
  }

  @Get('/one/:filename')
  @ApiOperation({ summary: 'Stream an image by filename', description: 'Streams an image file with optional resizing (width and height).' })
  @ApiParam({ name: 'filename', description: 'The URL-encoded name of the image file', type: String, example: 'avatar.png' })
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ description: 'Binary image stream', schema: { type: 'string', format: 'binary' } })
  @ApiBadRequestResponse({ description: 'Invalid filename or dimension parameters provided' })
  @ApiNotFoundResponse({ description: 'Image not found' })
  @CacheControl({ maxAge: 604_800, public: true })
  @Expires(604_800)
  async streamOneV2(@Param('filename') filename: unknown, @Query() query: ImageItemReqDto, @Res() response: Response): Promise<void> {
    if (typeof filename !== 'string' || filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const filenameParsed = decodeURIComponent(filename);
    const widthParsed = this.parseDimension(query.w, 'width');
    const heightParsed = this.parseDimension(query.h, 'height');

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

  @Get('/one/:filename/download')
  @ApiOperation({
    summary: 'Download an image file as an attachment',
    description: 'Downloads the image file with a `Content-Disposition: attachment` header. Allows optional dimension resizing.',
  })
  @ApiParam({ name: 'filename', description: 'The URL-encoded name of the image file to download', type: String, example: 'avatar.png' })
  @ApiProduces('application/octet-stream', 'image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({
    description: 'The downloaded image file attachment',
    schema: { type: 'string', format: 'binary' },
    headers: {
      'Content-Disposition': {
        description: 'Specifies the download attachment filename',
        schema: { type: 'string', example: 'attachment; filename="avatar.png"' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid filename or invalid dimension parameters provided' })
  @ApiNotFoundResponse({ description: 'Image file not found' })
  @CacheControl({ maxAge: 604_800, public: true })
  @Expires(604_800)
  async downloadOne(@Param('filename') filename: string, @Query() query: ImageItemReqDto, @Res() response: Response): Promise<void> {
    if (typeof filename !== 'string' || filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const filenameParsed = decodeURIComponent(filename);
    const widthParsed = this.parseDimension(query.w, 'width');
    const heightParsed = this.parseDimension(query.h, 'height');

    response.attachment(filenameParsed);

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
  @ApiOperation({
    summary: 'Get color palette of an image',
    description: 'Extracts and returns the dominant color palette for the specified image file.',
  })
  @ApiParam({ name: 'filename', description: 'The URL-encoded name of the image file', type: String, example: 'fur-gear-mylo.webp' })
  @ApiOkResponse({ description: 'Color palette successfully extracted.', type: ImageColorPaletteResDto })
  @ApiBadRequestResponse({ description: 'Invalid filename provided.' })
  @ApiNotFoundResponse({ description: 'Image file not found.' })
  async getPallette(@Param('filename') filename: string): Promise<ImageColorPaletteResDto> {
    if (typeof filename !== 'string' || filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const filenameParsed = decodeURIComponent(filename);

    return benchmark(this.logger, 'getPallette', () => {
      return this.imageService.getOnePallette(filenameParsed);
    });
  }
}
