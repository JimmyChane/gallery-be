import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export const CACHE_CONTROL_METADATA_KEY = 'cache-control';

export interface CacheControlOption {
  maxAge?: number;
  public?: boolean;
  private?: boolean;
}

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handlerOptions = this.reflector.get<CacheControlOption | undefined>(
      CACHE_CONTROL_METADATA_KEY,
      context.getHandler(),
    );

    const classOptions = this.reflector.get<CacheControlOption | undefined>(
      CACHE_CONTROL_METADATA_KEY,
      context.getClass(),
    );

    const mergedOptions: CacheControlOption = {
      ...classOptions,
      ...handlerOptions,
    };

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (!mergedOptions) return;

        const values: string[] = [];

        if (mergedOptions.public) {
          values.push('public');
        } else if (mergedOptions.private) {
          values.push('private');
        } else {
          values.push('private');
        }

        if (mergedOptions.maxAge !== undefined) {
          values.push(`max-age=${mergedOptions.maxAge}`);
        }

        if (values.length) {
          response.setHeader('Cache-Control', values.join(', '));
        }
      }),
    );
  }
}
