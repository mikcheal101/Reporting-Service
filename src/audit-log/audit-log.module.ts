/**
 * AuditLogModule — SOX-compliant audit trail module.
 *
 * Registers the AuditLog entity with TypeORM for auto-schema creation
 * (synchronize: true). Exports AuditLogService so it can be injected into
 * the AuditInterceptor registered globally in AppModule.
 *
 * Architecture:
 *   AppModule (APP_INTERCEPTOR)
 *     └─ AuditInterceptor  →  calls createAsync() after every mutation
 *                              └─ AuditLogService  →  AuditLog entity  →  DB
 *
 * @see AuditInterceptor — registered as a global provider in AppModule
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLog } from './entity/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  exports: [AuditLogService],
  providers: [AuditLogService],
  controllers: [AuditLogController],
})
export class AuditLogModule {}
