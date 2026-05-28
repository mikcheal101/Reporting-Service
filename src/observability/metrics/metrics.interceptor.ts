import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';
import { Reflector } from '@nestjs/core';
import { ROUTES } from '../../common/constants/routes.constant';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = this.resolveRoute(request.route?.path || request.url);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const response = context.switchToHttp().getResponse();
          this.metricsService.incrementHttpRequests(
            method,
            path,
            response.statusCode,
          );
          this.metricsService.observeHttpRequestDuration(
            method,
            path,
            duration,
          );
        },
        error: () => {
          const duration = (Date.now() - start) / 1000;
          this.metricsService.incrementHttpRequests(method, path, 500);
          this.metricsService.observeHttpRequestDuration(
            method,
            path,
            duration,
          );
        },
      }),
    );
  }

  private resolveRoute(routePath: string): string {
    if (!routePath) return 'unknown';
    const known = Object.values(ROUTES);
    for (const prefix of known) {
      if (routePath.startsWith(prefix)) return prefix;
    }
    return routePath;
  }
}
