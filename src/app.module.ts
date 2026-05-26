import { AppConfigModule } from '@app/app-config/app-config.module';
import { AppEnvModule } from '@app/app-env/app-env.module';
import { AuthModule } from '@app/auth/auth.module';
import { HealthModule } from '@app/health/health.module';
import { ImageModule } from '@app/image/image.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheControlInterceptor } from './cache-control/cache-control.interceptor';
import { ExpiresInterceptor } from './expires/expires.interceptor';

@Module({
  imports: [
    AppEnvModule,
    AppConfigModule,

    HealthModule,
    RouterModule.register([{ path: 'health', module: HealthModule }]),

    AuthModule,
    RouterModule.register([{ path: 'auth', module: AuthModule }]),

    ImageModule,
    RouterModule.register([{ path: 'api/img', module: ImageModule }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: CacheControlInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ExpiresInterceptor },
  ],
})
export class AppModule {}
