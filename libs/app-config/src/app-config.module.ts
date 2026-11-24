import { AppEnvModule } from '@app/app-env/app-env.module';
import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Module({
  imports: [AppEnvModule],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
