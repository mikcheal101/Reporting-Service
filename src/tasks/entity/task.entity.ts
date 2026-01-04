import { Report } from 'src/reports/entity/report.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
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

  @Column({ default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ onUpdate: 'GETDATE()', nullable: true })
  updatedAt: Date;
}
