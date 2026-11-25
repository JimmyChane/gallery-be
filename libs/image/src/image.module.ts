import { AppEnvModule } from '@app/app-env/app-env.module';
import { AuthModule } from '@app/auth/auth.module';
import { RedlockModule } from '@app/redlock/redlock.module';
import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';

@Module({
  imports: [AuthModule, AppEnvModule, RedlockModule],
  providers: [ImageService],
  controllers: [ImageController],
})
export class ImageModule {}
