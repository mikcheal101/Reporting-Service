import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
