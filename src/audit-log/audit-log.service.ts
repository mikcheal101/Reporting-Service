/**
 * AuditLogService — persistence and querying for audit-log entries.
 *
 * Single Responsibility: handles all AuditLog CRUD with filtering and pagination.
 * Used by AuditInterceptor (auto-logging) and AuditLogController (API queries).
 *
 * @see AuditInterceptor — calls createAsync after every mutation
 * @see AuditLogController — exposes findAllAsync and findOneAsync via REST
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuditLog } from './entity/audit-log.entity';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

/** Input contract for creating a new audit-log entry. */
export interface CreateAuditLogInput {
  /** ID of the authenticated user (null for system/anonymous) */
  userId?: number;
  /** Denormalized username for fast querying */
  username?: string;
  /** HTTP method: POST | PUT | PATCH | DELETE */
  action: string;
  /** Entity name extracted from URL (e.g. "users", "connections") */
  entity: string;
  /** ID of the affected record, if available */
  entityId?: number;
  /** Request body to snapshot (stringified to JSON internally) */
  newValues?: unknown;
  /** Client IP from the HTTP request */
  ipAddress?: string;
}

/** Filter contract for querying audit logs. */
export interface AuditLogFilter {
  /** Filter by entity name */
  entity?: string;
  /** Filter by HTTP method / action */
  action?: string;
  /** Filter by user ID */
  userId?: number;
  /** ISO date string — only logs after this date */
  from?: string;
  /** ISO date string — only logs before this date */
  to?: string;
  /** Page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {
    this.logger = new Logger(AuditLogService.name);
  }

  /**
   * Persist a new audit-log entry. Called by AuditInterceptor after every mutation.
   * Silently swallows errors so audit failures never break the main request flow.
   */
  public createAsync = async (input: CreateAuditLogInput): Promise<void> => {
    try {
      const details = input.newValues
        ? JSON.stringify(input.newValues)
        : undefined;

      const log = this.auditLogRepository.create({
        userId: input.userId,
        username: input.username,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details,
        ipAddress: input.ipAddress,
      });

      await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error('Failed to create audit log', error.stack);
    }
  };

  /**
   * Query audit logs with optional filters, sorted by newest first.
   * Supports pagination via page/limit. Date filters are inclusive.
   */
  public findAllAsync = async (
    filter: AuditLogFilter,
  ): Promise<{ data: AuditLogResponseDto[]; total: number }> => {
    try {
      const where: FindOptionsWhere<AuditLog> = {};

      if (filter.entity) where.entity = filter.entity;
      if (filter.action) where.action = filter.action;
      if (filter.userId) where.userId = filter.userId;

      const query = this.auditLogRepository
        .createQueryBuilder('audit')
        .where(where);

      if (filter.from) {
        query.andWhere('audit.createdAt >= :from', {
          from: new Date(filter.from),
        });
      }

      if (filter.to) {
        query.andWhere('audit.createdAt <= :to', {
          to: new Date(filter.to),
        });
      }

      const [data, total] = await query
        .orderBy('audit.createdAt', 'DESC')
        .skip((filter.page - 1) * filter.limit)
        .take(filter.limit)
        .getManyAndCount();

      return {
        data: data.map((log) => this.mapToDto(log)),
        total,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  /**
   * Purge audit logs older than the specified number of days.
   * Returns the count of deleted records.
   */
  public purgeOlderThanAsync = async (days: number): Promise<number> => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .from(AuditLog)
        .where('createdAt < :cutoff', { cutoff })
        .execute();

      const count = result.affected || 0;
      if (count > 0) {
        this.logger.log(`Purged ${count} audit log(s) older than ${days} days`);
      }
      return count;
    } catch (error) {
      this.logger.error('Failed to purge audit logs', error.stack);
      throw error;
    }
  };

  /** Fetch a single audit log by ID. */
  public findOneAsync = async (id: number): Promise<AuditLogResponseDto> => {
    try {
      const log = await this.auditLogRepository.findOneByOrFail({ id });
      return this.mapToDto(log);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  /** Map entity to DTO to decouple the internal schema from the API contract. */
  private mapToDto = (log: AuditLog): AuditLogResponseDto => ({
    id: log.id,
    userId: log.userId,
    username: log.username,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details: log.details,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
  });
}
