import { LocalFileService } from '@app/local-file/local-file.service';
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { FilenameModel } from '../model/filename.model';
import { ImageFormatService } from './image-format.service';

@Injectable()
export class ImageDimensionService {
  constructor(
    private readonly localFileService: LocalFileService,
    private readonly imageFormatService: ImageFormatService,
  ) {}

  async getFileDimensionByFilename(filename: string): Promise<{ width?: number; height?: number } | undefined> {
    const filenameObj = new FilenameModel(filename);
    if (filenameObj.ext !== this.imageFormatService.WEBP.ext) {
      const absolutePath = this.localFileService.getAbsolutePathOfFilename(filenameObj.toString());
      const imageStream = sharp(absolutePath);
      const metadata = await imageStream.metadata();
      const dimen = { width: metadata.width, height: metadata.height };
      imageStream.destroy();
      return dimen;
    }

    const fileReadStream = await this.localFileService.readStreamFilename(filenameObj.toString());
    return new Promise((resolve, reject) => {
      let width = 0;
      let height = 0;

      const sharpStream = sharp().on('info', (info) => {
        width = info.width;
        height = info.height;
      });

      fileReadStream
        .pipe(sharpStream)
        .on('data', () => {})
        .on('close', () => resolve({ width, height }))
        .on('error', (error) => reject(error));
    });
  }
}
