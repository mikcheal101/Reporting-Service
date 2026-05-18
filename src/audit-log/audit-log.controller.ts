/**
 * AuditLogController — REST API for querying audit logs.
 *
 * Exposes two read-only endpoints for viewing the SOX-compliant audit trail.
 * Mutation endpoints are intentionally omitted; logs are created only by the
 * AuditInterceptor to prevent tampering.
 *
 * @route GET /api/v1/audit-logs — paginated, filterable list
 * @route GET /api/v1/audit-logs/:id — single entry
 *
 * @see AuditInterceptor — the sole writer of audit-log entries
 */
import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { ROUTES } from '../common/constants/routes.constant';

@Controller(ROUTES.AUDIT)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * List audit logs with optional filters and pagination.
   *
   * @query entity  — filter by target entity name
   * @query action  — filter by HTTP method (POST, PUT, DELETE)
   * @query userId  — filter by actor user ID
   * @query from    — inclusive start date (ISO string)
   * @query to      — inclusive end date (ISO string)
   * @query page    — page number (default: 1)
   * @query limit   — items per page (default: 20, max: 100)
   */
  @HttpCode(HttpStatus.OK)
  @Get()
  public async findAll(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<{ data: AuditLogResponseDto[]; total: number }> {
    try {
      return await this.auditLogService.findAllAsync({
        entity,
        action,
        userId: userId ? Number.parseInt(userId) : undefined,
        from,
        to,
        page: page || 1,
        limit: Math.min(limit || 20, 100),
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  /** Fetch a single audit-log entry by its ID. */
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AuditLogResponseDto> {
    try {
      return await this.auditLogService.findOneAsync(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
