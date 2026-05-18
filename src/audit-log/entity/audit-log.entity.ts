/**
 * AuditLog entity — records every mutation (CREATE/UPDATE/DELETE) across the system.
 *
 * Auto-populated by the global AuditInterceptor. Each row captures who did what,
 * to which entity, when, and from where. This provides a SOX-compliant audit trail
 * without requiring manual logging calls in individual services.
 *
 * @see AuditInterceptor — the interceptor that auto-creates these records
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  /** Auto-generated primary key */
  @PrimaryGeneratedColumn()
  id: number;

  /** ID of the authenticated user who performed the action (nullable for system actions) */
  @Column({ nullable: true })
  userId: number;

  /** Denormalized username for fast querying without joins */
  @Column({ nullable: true })
  username: string;

  /** HTTP method: POST (CREATE), PUT/PATCH (UPDATE), DELETE */
  @Column()
  action: string;

  /** Entity name extracted from the URL path (e.g. "users", "connections") */
  @Column()
  entity: string;

  /** ID of the affected record, extracted from `:id` route parameter */
  @Column({ nullable: true })
  entityId: number;

  /** JSON string of the request body (new state) — omitted for DELETE */
  @Column({ type: 'nvarchar', nullable: true, length: 'MAX' })
  details: string;

  /** Client IP address from the HTTP request */
  @Column({ nullable: true })
  ipAddress: string;

  /** Timestamp set automatically by TypeORM on creation */
  @CreateDateColumn()
  createdAt: Date;
}
