import { ColorPaletteResDto } from '@app/image/dto/image-palette.res.dto';
import { FilenameModel } from '@app/image/filename.model';
import { ImageListService } from '@app/image/image-list.service';
import { ImageStreamService } from '@app/image/image-stream.service';
import { LocalFileService } from '@app/local-file/local-file.service';
import { RedlockService } from '@app/redlock/redlock.service';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Vibrant } from 'node-vibrant/node';
import { ImageItemResDto } from './dto/image-item.res.dto';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly redlockService: RedlockService,
    private readonly localFileService: LocalFileService,
    private readonly imagelistService: ImageListService,
    private readonly imageStreamService: ImageStreamService,
  ) {}

  // TODO: GET as pagable
  async getList(): Promise<ImageItemResDto[]> {
    const filenames = await this.imagelistService.getList();
    return filenames.map((filename) => {
      return { filename: encodeURIComponent(filename).toString() };
    });
  }

  async streamOne(
    payload: { filename: string; width?: string | number; height?: string | number },
    result: { contentType: (contentType: string) => void; write: (chunk: any) => void; end: () => void },
  ): Promise<void> {
    const { filename, width, height } = payload;

    if (filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const name = decodeURIComponent(filename);

    const error = await this.redlockService.using(name, 1000, async () => {
      await this.imageStreamService.streamImage({ filename: name, width, height }, result);
    });
    if (error === 'conflict') throw new ConflictException();
  }

  async getOnePallette(filename: string): Promise<ColorPaletteResDto> {
    const filenameObj = new FilenameModel(filename);
    const path = this.localFileService.getAbsolutePathOfFilename(filenameObj.toString());

    const palette = await Vibrant.from(path)
      .getPalette()
      .catch((e: Error) => e);
    if (palette instanceof Error) {
      this.logger.error(palette);
      throw new InternalServerErrorException('Failed to extract colors');
    }

    return {
      vibrant: palette.Vibrant?.hex,
      vibrantDark: palette.DarkVibrant?.hex,
      vibrantLight: palette.LightVibrant?.hex,
      muted: palette.Muted?.hex,
      mutedDark: palette.DarkMuted?.hex,
      mutedLight: palette.LightMuted?.hex,
    };
  }
}
