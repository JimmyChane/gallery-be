import { AppEnvService } from '@app/app-env/app-env.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { wrapWhite } from './util/console.text-wrapper';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly VERSION_NAME = 'v1.0.0';
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly envService: AppEnvService) {}

  onModuleInit(): void {
    this.logger.log(`App Version ${wrapWhite(this.VERSION_NAME)}`);

    this.logger.log(`APP_ENV_MODE ${wrapWhite(this.envService.APP_ENV_MODE)}`);
    this.logger.log(
      `APP_ALLOWED_CROSS_ORIGIN ${wrapWhite(JSON.stringify(this.envService.APP_ALLOWED_CROSS_ORIGIN))}`,
    );
  }
}
