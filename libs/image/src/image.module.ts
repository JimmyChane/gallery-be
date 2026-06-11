import { AppEnvModule } from '@app/app-env/app-env.module';
import { AuthModule } from '@app/auth/auth.module';
import { LocalFileModule } from '@app/local-file/local-file.module';
import { RedlockModule } from '@app/redlock/redlock.module';
import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { ImageDimensionService } from './service/image-dimension.service';
import { ImageFormatService } from './service/image-format.service';
import { ImageListService } from './service/image-list.service';
import { ImageStreamService } from './service/image-stream.service';

@Module({
  imports: [AuthModule, AppEnvModule, RedlockModule, LocalFileModule],
  providers: [ImageDimensionService, ImageFormatService, ImageListService, ImageService, ImageStreamService],
  controllers: [ImageController],
  exports: [ImageListService, ImageStreamService],
})
export class ImageModule {}
