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
