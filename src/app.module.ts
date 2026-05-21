import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { ConnectionsModule } from './connections/connections.module';
import { CryptoModule } from './common/security/crypto/crypto.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReportTypesModule } from './report-types/report-types.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { MailModule } from './mail/mail.module';
import { RolesController } from './roles/roles.controller';
import { RolesModule } from './roles/roles.module';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsModule } from './permissions/permissions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuditInterceptor } from './audit-log/interceptor/audit.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ObservabilityModule } from './observability/observability.module';
import { MetricsInterceptor } from './observability/metrics/metrics.interceptor';
import { MetricsService } from './observability/metrics/metrics.service';
import { GracefulShutdownService } from './observability/graceful-shutdown.service';
import { SentryFilter } from './observability/sentry.filter';
import { LoggerModule } from 'nestjs-pino';
import { CircuitBreakerModule } from './observability/circuit-breaker/circuit-breaker.module';
import { DbPoolMonitorModule } from './observability/db-pool-monitor/db-pool-monitor.module';
import { TracingModule } from './observability/tracing/tracing.module';
import { ComplianceModule } from './compliance/compliance.module';
import { CacheModule } from './common/cache/cache.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
        serializers: {
          req: (req) => ({ method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
        autoLogging: {
          ignore: (req) => (req as { url?: string }).url === '/api/v1/health',
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: false,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get<string>('DB_HOST'),
        port: Number.parseInt(config.get<string>('DB_PORT'), 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        synchronize: false,
        migrationsRun: true,
        migrations: ['dist/database/migrations/*.js'],
        autoLoadEntities: true,
        extra: {
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }),
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
    CryptoModule,
    AuthModule,
    UsersModule,
    ConnectionsModule,
    ReportTypesModule,
    ReportsModule,
    TasksModule,
    MailModule,
    RolesModule,
    PermissionsModule,
    DashboardModule,
    AuditLogModule,
    ObservabilityModule,
    CircuitBreakerModule,
    DbPoolMonitorModule,
    CacheModule,
    TracingModule,
    ComplianceModule,
    WebsocketModule,
  ],
  controllers: [AppController, RolesController, PermissionsController],
  providers: [
    AppService,
    GracefulShutdownService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: SentryFilter,
    },
    MetricsService,
  ],
})
export class AppModule {}
