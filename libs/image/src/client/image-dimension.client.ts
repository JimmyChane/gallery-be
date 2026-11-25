import { LocalFileClient } from '@app/image/client/local-file.client';
import sharp from 'sharp';
import { FilenameModel } from '../model/filename.model';
import { ImageFormatClient } from './image-format.client';

export class ImageDimensionClient {
  constructor(
    private readonly localFileClient: LocalFileClient,
    private readonly imageFormatClient: ImageFormatClient,
  ) {}

  async getFileDimensionByFilename(
    filename: string,
  ): Promise<{ width?: number; height?: number } | undefined> {
    const filenameObj = new FilenameModel(filename);
    if (filenameObj.ext !== this.imageFormatClient.WEBP.ext) {
      const absolutePath = this.localFileClient.getAbsolutePathOfFilename(
        filenameObj.toString(),
      );
      const imageStream = sharp(absolutePath);
      const metadata = await imageStream.metadata();
      const dimen = { width: metadata.width, height: metadata.height };
      imageStream.destroy();
      return dimen;
    }

    const fileReadStream = await this.localFileClient.readStreamFilename(
      filenameObj.toString(),
    );
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
