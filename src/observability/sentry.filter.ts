import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Catch()
export class SentryFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryFilter.name);
  private readonly dsn: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.dsn = this.configService.get<string>('SENTRY_DSN');
    if (this.dsn) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/node');
        Sentry.init({ dsn: this.dsn, environment: process.env.NODE_ENV || 'development' });
        this.logger.log('Sentry error tracking initialized');
      } catch {
        this.logger.warn('Failed to initialize Sentry');
      }
    }
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500 && this.dsn) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/node');
        Sentry.captureException(exception, {
          extra: {
            method: request.method,
            url: request.url,
            body: request.body,
          },
        });
      } catch {
        // Sentry not available
      }
    }

    if (status >= 500) {
      this.logger.error(`Unhandled exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`, exception instanceof Error ? exception.stack : '');
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception instanceof HttpException ? exception.getResponse() : 'Internal server error',
    });
  }
}
