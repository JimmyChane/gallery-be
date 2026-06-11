export class ImageDimensionModel {
  width?: number = 0;
  height?: number = 0;

  constructor(width: number | string = 0, height: number | string = 0) {
    if (typeof width === 'string') {
      width = Number.parseInt(width);
      width = !Number.isNaN(width) ? width : 0;
    }

    if (typeof height === 'string') {
      height = Number.parseInt(height);
      height = !Number.isNaN(height) ? height : 0;
    }

    if (width > 0) this.width = width;
    if (height > 0) this.height = height;
  }

  isSet(): boolean {
    const width = this.width ?? 0;
    const height = this.height ?? 0;

    return width > 0 || height > 0;
  }
}
