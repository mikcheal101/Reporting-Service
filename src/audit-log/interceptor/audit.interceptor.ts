/**
 * AuditInterceptor — global NestJS interceptor that auto-logs all mutations.
 *
 * Registered as APP_INTERCEPTOR in AppModule, it intercepts every HTTP request.
 * For POST/PUT/PATCH/DELETE, it extracts entity info from the URL and persists
 * an audit-log entry after the request handler succeeds (using RxJS tap).
 *
 * Design principles:
 *  - Non-blocking: audit failures never throw (logged and swallowed).
 *  - Fire-and-forget: runs after the response is sent (tap on the observable).
 *  - Excluded paths: audit-logs (prevent recursion) and auth (login/logout noise).
 *
 * @see AuditLogService — the persistence target
 * @see AuditLogModule — provides the service to this interceptor
 */
import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger: Logger;

  constructor(private readonly auditLogService: AuditLogService) {
    this.logger = new Logger(AuditInterceptor.name);
  }

  /**
   * Intercept every request. Logs mutations after the handler succeeds.
   * - GET/HEAD/OPTIONS: ignored (read-only)
   * - POST/PUT/PATCH/DELETE: logged with entity, action, user, body, IP
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    // Skip read-only operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const entity: string = this.extractEntity(request.url);

    // Skip audit-log and auth endpoints to prevent recursion / noise
    if (entity === 'audit-logs' || entity === 'auth') {
      return next.handle();
    }

    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        try {
          this.auditLogService.createAsync({
            userId: user?.id,
            username: user?.username,
            action: method,
            entity,
            entityId: request.params?.id
              ? Number(request.params.id)
              : undefined,
            newValues: method !== 'DELETE' ? request.body : undefined,
            ipAddress: request.ip,
          });
        } catch (error) {
          this.logger.error('Failed to write audit log', error.stack);
        }
      }),
    );
  }

  /**
   * Extract the entity name from the API URL path.
   * Matches the segment after `/api/v1/` and maps it to a canonical name.
   *
   * @example
   *   '/api/v1/users/5'       → 'users'
   *   '/api/v1/connections'    → 'connections'
   *   '/api/v1/report-types'   → 'report-types'
   */
  private extractEntity(url: string): string {
    const match = url.match(/\/api\/v1\/([^/?]+)/);
    if (!match) return 'unknown';

    const segment = match[1];

    // Canonical entity names (explicit map ensures consistency)
    const entityMap: Record<string, string> = {
      users: 'users',
      connections: 'connections',
      'report-types': 'report-types',
      reports: 'reports',
      tasks: 'tasks',
      roles: 'roles',
      permissions: 'permissions',
      'audit-logs': 'audit-logs',
      auth: 'auth',
    };

    return entityMap[segment] || segment;
  }
}
