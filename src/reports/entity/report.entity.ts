import { Connection } from 'src/connections/entity/connections.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportDetail } from './report-detail.entity';
import { QueryParameter } from './query-parameter.entity';
import { Task } from 'src/tasks/entity/task.entity';

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => Connection, { onDelete: 'CASCADE' })
  @JoinColumn()
  connection: Connection;

  @ManyToOne(() => ReportType, { onDelete: 'CASCADE' })
  @JoinColumn()
  reportType: ReportType;

  @OneToMany(() => ReportDetail, (reportDetail) => reportDetail.report)
  reportDetails: ReportDetail[];

  @Column({ type: 'text', nullable: true })
  queryString?: string;

  @OneToMany(() => QueryParameter, (parameter) => parameter.report)
  parameters?: QueryParameter[];

  @OneToOne(() => Task, (task) => task.report, { onDelete: 'CASCADE' })
  task: Task;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
