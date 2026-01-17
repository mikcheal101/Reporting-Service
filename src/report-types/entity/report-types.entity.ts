import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Frequency } from './frequency.enum';
import { OutputFormat } from '../../common/exporters/output-format.enum';
import { Report } from 'src/reports/entity/report.entity';

@Entity()
export class ReportType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  datetime: Date;

  @Column({ nullable: true })
  emails: string;

  @Column({ nullable: true })
  frequency: Frequency;

  @Column({ nullable: true })
  outputType: OutputFormat;

  @OneToMany(() => Report, (report) => report.reportType, {
    onDelete: 'CASCADE',
  })
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
