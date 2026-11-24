import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .json({ message: exception.message });
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal Server Error' });
  }
}
