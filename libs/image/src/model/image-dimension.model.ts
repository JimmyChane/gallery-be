import { optNumber } from '@chanzor/utils';

export class ImageDimensionModel {
  width?: number = 0;
  height?: number = 0;

  constructor(width: number | undefined, height: number | undefined) {
    this.width = optNumber(width);
    this.height = optNumber(height);
  }

  isSet(): boolean {
    const width = this.width ?? 0;
    const height = this.height ?? 0;

    return width > 0 || height > 0;
  }
}
