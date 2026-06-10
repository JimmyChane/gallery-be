import { AppEnvModule } from '@app/app-env/app-env.module';
import { AuthModule } from '@app/auth/auth.module';
import { LocalFileModule } from '@app/local-file/local-file.module';
import { RedlockModule } from '@app/redlock/redlock.module';
import { Module } from '@nestjs/common';
import { ImageDimensionService } from './image-dimension.service';
import { ImageFormatService } from './image-format.service';
import { ImageListService } from './image-list.service';
import { ImageStreamService } from './image-stream.service';
import { ImageService } from './image.service';

@Module({
  imports: [AuthModule, AppEnvModule, RedlockModule, LocalFileModule],
  providers: [ImageDimensionService, ImageFormatService, ImageListService, ImageService, ImageStreamService],
  exports: [ImageListService, ImageService, ImageStreamService],
})
export class ImageModule {}
