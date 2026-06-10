import { AuthModule } from '@app/auth/auth.module';
import { ImageModule } from '@app/image/image.module';
import { UserModule } from '@app/user/user.module';
import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { UserController } from './user.controller';

@Module({ imports: [AuthModule, UserModule, ImageModule], controllers: [UserController, ImageController] })
export class ApiModule {}
