/**
 * AuditLogResponseDto — the shape of audit-log data returned by the API.
 *
 * Maps from the raw AuditLog entity while keeping internal DB details hidden.
 * Uses class-validator decorators for NestJS ValidationPipe compatibility.
 */
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AuditLogResponseDto {
  /** Auto-generated log entry ID */
  @IsNumber()
  id: number;

  /** ID of the user who performed the action */
  @IsOptional()
  @IsNumber()
  userId?: number;

  /** Username (denormalized for fast reads) */
  @IsOptional()
  @IsString()
  username?: string;

  /** HTTP method / action type (POST → CREATE, PUT → UPDATE, DELETE) */
  @IsString()
  action: string;

  /** Target entity name (e.g. "users", "connections") */
  @IsString()
  entity: string;

  /** ID of the affected record — null for collection-level actions */
  @IsOptional()
  @IsNumber()
  entityId?: number;

  /** JSON payload of the mutation (request body stringified) */
  @IsOptional()
  @IsString()
  details?: string;

  /** Originating IP address */
  @IsOptional()
  @IsString()
  ipAddress?: string;

  /** ISO timestamp of when the mutation occurred */
  createdAt: Date;
}
