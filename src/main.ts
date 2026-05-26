import { AppConfigService } from '@app/app-config/app-config.service';
import { AppEnvService } from '@app/app-env/app-env.service';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './global-exception.filter';
import { wrapCyan } from './util/console.text-wrapper';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const appEnvService = app.get(AppEnvService);
  const appConfigService = app.get(AppConfigService);

  app.enableShutdownHooks();
  app.enableCors({ ...appConfigService.buildCorsOption(), allowedHeaders: 'Content-Type,Authorization', credentials: true });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder().setTitle('API').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(appEnvService.APP_PORT);

  console.log(`Listening on ${wrapCyan(`http://localhost:${appEnvService.APP_PORT}`)}`);
  console.log(`Swagger on ${wrapCyan(`http://localhost:${appEnvService.APP_PORT}/swagger`)}`);
}
bootstrap();
