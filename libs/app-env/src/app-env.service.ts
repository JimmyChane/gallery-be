import { optionalEnvAllowedCrossOrigin, requireEnvMode, requireEnvPort } from '@chanzor/nest-leaf';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppEnvService {
  readonly APP_PORT: number;
  readonly APP_ENV_MODE: 'dev' | 'prod';
  readonly APP_ALLOWED_CROSS_ORIGIN: string[];

  constructor(private readonly configService: ConfigService) {
    this.APP_PORT = requireEnvPort(configService, 'PORT');
    this.APP_ENV_MODE = requireEnvMode(configService, 'NODE_ENV');
    this.APP_ALLOWED_CROSS_ORIGIN = optionalEnvAllowedCrossOrigin(configService, 'ALLOWED_CROSS_ORIGIN') ?? [];
  }

  get<T>(key: string): T | undefined {
    return this.configService.get<T>(key);
  }
}
