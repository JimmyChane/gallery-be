import { benchmark } from '@/util/benchmark';
import { LocalFileService } from '@app/local-file/local-file.service';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import sharp, { Sharp } from 'sharp';
import { FilenameModel } from '../model/filename.model';
import { ImageDimensionModel } from '../model/image-dimension.model';
import { ImageDimensionService } from './image-dimension.service';
import { ImageFormatService } from './image-format.service';

@Injectable()
export class ImageStreamService {
  private readonly logger = new Logger(ImageStreamService.name);

  constructor(
    private readonly localFileService: LocalFileService,
    private readonly imageDimensionService: ImageDimensionService,
    private readonly imageFormatService: ImageFormatService,
  ) {}

  async streamImage(
    payload: { filename: string; width?: number; height?: number },
    result: { contentType: (contentType: string) => void; write: (chunk: any) => void; end: () => void },
  ): Promise<void> {
    const { filename, width, height } = payload;

    const dimenReq = new ImageDimensionModel(width, height);
    const filenameReq = new FilenameModel(filename);

    const filenameSrc = await (async () => {
      const filenameSrc = new FilenameModel(filename);

      const isFile = await benchmark(this.logger, 'isFile', () => {
        return this.localFileService.isFile(filenameSrc.toString());
      });
      if (isFile) return filenameSrc;

      const formats = await benchmark(this.logger, 'getFormat', () => {
        return this.imageFormatService.getFormatsByName(filenameReq.name);
      });
      const [format] = formats;
      if (format) return new FilenameModel(filenameReq.name, format.ext);

      return undefined;
    })();
    if (!filenameSrc) throw new NotFoundException('no files found');

    // checking supported format
    const format = this.imageFormatService.getList().find((format) => format.ext === filenameReq.ext);
    if (!format) throw new BadRequestException('format not support');

    result.contentType(format.mimetype);

    let transformer: Sharp | undefined = undefined;

    // transform size
    transformer = await benchmark(this.logger, 'transfomer', async () => {
      if (!dimenReq.isSet()) return undefined;

      const dimenImg = await benchmark(this.logger, 'getFileDimensionByFilename', () => {
        return this.imageDimensionService.getFileDimensionByFilename(filenameSrc.toString());
      });

      const isSameWidth = dimenReq.width === dimenImg?.width;
      const isSameHeight = dimenReq.height === dimenImg?.height;
      const onlyWidth = dimenReq.width && !dimenReq.height;
      const onlyHeight = !dimenReq.width && dimenReq.height;

      const isSameDimension = isSameWidth && isSameHeight;
      const onlySameWidth = onlyWidth && isSameWidth;
      const onlySameHeight = onlyHeight && isSameHeight;

      if (isSameDimension || onlySameWidth || onlySameHeight) {
        return undefined;
      }

      if ((dimenReq.width ?? 0) > (dimenImg?.width ?? 0)) {
        dimenReq.width = dimenImg?.width;
      }
      if ((dimenReq.height ?? 0) > (dimenImg?.height ?? 0)) {
        dimenReq.height = dimenImg?.height;
      }

      if (dimenReq.width === 0) dimenReq.width = undefined;
      if (dimenReq.height === 0) dimenReq.height = undefined;

      return sharp().resize(dimenReq);
    });

    // transform media type
    if (filenameReq.ext !== filenameSrc.ext) {
      const newTransformer = (() => {
        if (transformer) return transformer;

        return sharp();
      })();

      switch (filenameReq.ext) {
        case this.imageFormatService.PNG.ext:
          newTransformer.png();
          break;
        case this.imageFormatService.JPG.ext:
        case this.imageFormatService.JPEG.ext:
          newTransformer.jpeg();
          break;
        case this.imageFormatService.WEBP.ext:
          newTransformer.webp();
          break;
      }

      transformer = newTransformer;
    }

    const readStream = await benchmark(this.logger, 'readStream', async () => {
      const readStream = await benchmark(this.logger, 'readStreamFilename', () => {
        return this.localFileService.readStreamFilename(filenameSrc.toString());
      });
      if (!transformer) return readStream;

      return readStream.pipe(transformer);
    });
    readStream.on('data', (chunk: any) => result.write(chunk));
    readStream.on('end', () => result.end());
    readStream.on('error', (error: any) => {
      this.logger.error(error);
      throw new InternalServerErrorException('read fail');
    });
  }
}
