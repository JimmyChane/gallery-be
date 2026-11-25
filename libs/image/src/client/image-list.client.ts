import { wrapWhite } from '@/util/console.text-wrapper';
import { LocalFileClient } from '@app/image/client/local-file.client';
import { Logger } from '@nestjs/common';
import { ImageFormatClient } from './image-format.client';

export class ImageListClient {
  private readonly logger = new Logger(ImageListClient.name);

  private FILE_TYPES!: string[];

  constructor(
    private readonly localFileClient: LocalFileClient,
    private readonly imageFormatClient: ImageFormatClient,
  ) {}

  async start(): Promise<void> {
    const fileTypes = this.imageFormatClient
      .getList()
      .reduce((formats: string[], image) => {
        formats.push(image.ext.toLowerCase());
        formats.push(image.ext.toUpperCase());
        return formats;
      }, []);

    for (const fileType of fileTypes) {
      if (fileType.includes('.'))
        throw new Error('fileTypes shall not include "."');
    }

    this.FILE_TYPES = fileTypes.map((fileType) => `.${fileType}`);

    this.logger.log(
      `File Types: ${wrapWhite(JSON.stringify(this.FILE_TYPES))}`,
    );
  }

  async getList(): Promise<string[]> {
    return this.localFileClient.getList(this.FILE_TYPES);
  }

  // TODO: test
  async getListPagable(
    page = 0,
    limit = 10,
  ): Promise<{
    items: string[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    return this.localFileClient.getListPagable(this.FILE_TYPES, page, limit);
  }
}
