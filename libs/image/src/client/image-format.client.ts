import { LocalFileClient } from '@app/image/client/local-file.client';
import { FilenameModel } from '../model/filename.model';

export enum ImageFormatId {
  WEBP = 'webp',
  PNG = 'png',
  JPG = 'jpg',
  JPEG = 'jpeg',
}

export class ImageFormatModel {
  constructor(
    readonly mimetype: string,
    readonly ext: ImageFormatId,
  ) {}

  isSameMimetype(mimetype: string): boolean {
    return this.mimetype === mimetype;
  }
  isSameExt(ext: string): boolean {
    return this.ext === ext;
  }
}

export class ImageFormatClient {
  readonly WEBP = new ImageFormatModel('image/webp', ImageFormatId.WEBP);
  readonly PNG = new ImageFormatModel('image/png', ImageFormatId.PNG);
  readonly JPG = new ImageFormatModel('image/jpg', ImageFormatId.JPG);
  readonly JPEG = new ImageFormatModel('image/jpeg', ImageFormatId.JPEG);

  private readonly MAPS: Record<ImageFormatId, ImageFormatModel> = {
    [ImageFormatId.WEBP]: this.WEBP,
    [ImageFormatId.PNG]: this.PNG,
    [ImageFormatId.JPG]: this.JPG,
    [ImageFormatId.JPEG]: this.JPEG,
  };

  private readonly LIST = Object.values(this.MAPS);

  constructor(private readonly localFileClient: LocalFileClient) {}

  getList(): ImageFormatModel[] {
    return this.LIST;
  }

  async getFormatsByName(name: string): Promise<ImageFormatModel[]> {
    const formats: ImageFormatModel[] = [];
    for (const format of this.LIST) {
      const filename = new FilenameModel(name, format.ext);
      const isFile = this.localFileClient.isFile(filename.toString());
      if (isFile) formats.push(format);
    }
    return formats;
  }

  private parseMimeTypeToExt(mimetype: string): string {
    for (const format of this.LIST) {
      if (format.isSameMimetype(mimetype)) return format.ext;
    }
    throw new Error('file type not supported');
  }
}
