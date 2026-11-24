import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { AppEnvService } from './app-env.service';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: join(cwd(), '.env') })],
  providers: [AppEnvService],
  exports: [AppEnvService],
})
export class AppEnvModule {}
