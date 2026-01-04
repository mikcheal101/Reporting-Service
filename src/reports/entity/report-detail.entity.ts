import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Report } from './report.entity';

@Entity()
export class ReportDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  tableName?: string;

  @Column({ nullable: true })
  fieldName?: string;

  @Column({ nullable: true })
  dataType?: string;

  @ManyToOne(() => Report, { onDelete: 'CASCADE' })
  @JoinColumn()
  report: Report;

  @Column({ default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ onUpdate: 'GETDATE()', nullable: true })
  updatedAt: Date;
}
