import { ApiProperty } from '@nestjs/swagger';
import { ImageItemResDto } from './image-item.res.dto';

// TODO: test
export class PaginationMetaResDto {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 0 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: false })
  hasPrev!: boolean;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}

// TODO: test
export class ImageListPagableResDto {
  @ApiProperty({ type: [ImageItemResDto] })
  items!: ImageItemResDto[];

  @ApiProperty({ type: () => PaginationMetaResDto })
  meta!: PaginationMetaResDto;
}
