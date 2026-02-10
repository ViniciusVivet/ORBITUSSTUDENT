import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Erro interno do servidor' };

    const body =
      typeof message === 'object' && message !== null && 'message' in message
        ? (message as { message: string | string[] })
        : { message: String(message) };

    const payload = {
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message: body.message,
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    if (status >= 500) {
      this.logger.error(exception);
    }

    res.status(status).json(payload);
  }
}
