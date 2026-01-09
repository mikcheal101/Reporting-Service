import { Report } from 'src/reports/entity/report.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from './task-status.enum';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @OneToOne(() => Report, (report) => report.task)
  @JoinColumn()
  report: Report;

  @Column({ nullable: false })
  cronExpression: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: TaskStatus.SCHEDULED })
  status: TaskStatus;

  @Column({ nullable: true })
  payload: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
