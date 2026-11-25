import { LocalFileClient } from '@app/image/client/local-file.client';
import { RedlockService } from '@app/redlock/redlock.service';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { join } from 'path';
import { cwd } from 'process';
import { ImageFormatClient } from './client/image-format.client';
import { ImageListClient } from './client/image-list.client';
import { ImageStreamClient } from './client/image-stream.client';
import { ImageColorPaletteResDto } from './dto/image-color-palette.res.dto';
import { ImageItemResDto } from './dto/image-item.res.dto';
import { FilenameModel } from './model/filename.model';

const Vibrant = require('node-vibrant');

@Injectable()
export class ImageService implements OnModuleInit {
  private readonly logger = new Logger(ImageService.name);

  private readonly localFileClient: LocalFileClient;
  private readonly imageFormatClient: ImageFormatClient;
  private readonly imageListClient: ImageListClient;
  private readonly imageStreamClient: ImageStreamClient;

  constructor(private readonly redlockService: RedlockService) {
    this.localFileClient = new LocalFileClient({
      dir: join(cwd(), '/temp/gallery-be/res'),
    });
    this.imageFormatClient = new ImageFormatClient(this.localFileClient);
    this.imageListClient = new ImageListClient(
      this.localFileClient,
      this.imageFormatClient,
    );
    this.imageStreamClient = new ImageStreamClient(
      this.localFileClient,
      this.imageFormatClient,
    );
  }

  async onModuleInit() {
    await this.localFileClient.start();
    await this.imageListClient.start();
  }

  async getList(): Promise<ImageItemResDto[]> {
    const filenames = await this.imageListClient.getList();
    return filenames.map((filename) => {
      return { filename: encodeURIComponent(filename).toString() };
    });
  }

  // TODO: test
  async getListPagable(
    page = 0,
    limit = 10,
  ): Promise<{
    items: { filename: string }[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const result = await this.imageListClient.getListPagable(page, limit);
    return {
      items: result.items.map((filename) => ({
        filename: encodeURIComponent(filename).toString(),
      })),
      meta: result.meta,
    };
  }

  async streamOne(
    payload: { filename: string; width?: number; height?: number },
    result: {
      contentType: (contentType: string) => void;
      write: (chunk: any) => void;
      end: () => void;
    },
  ): Promise<void> {
    const { filename, width, height } = payload;

    const error = await this.redlockService.using(filename, 1000, async () => {
      await this.imageStreamClient.streamImage(
        { filename: filename, width, height },
        result,
      );
    });
    if (error === 'conflict') throw new ConflictException();
  }

  async getOnePallette(filename: string): Promise<ImageColorPaletteResDto> {
    const filenameObj = new FilenameModel(filename);
    const path = this.localFileClient.getAbsolutePathOfFilename(
      filenameObj.toString(),
    );

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
