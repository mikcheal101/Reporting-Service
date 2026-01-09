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
export class QueryParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  value: string;

  @Column({ nullable: false })
  dataType: string;

  @ManyToOne(() => Report, { onDelete: 'CASCADE' })
  @JoinColumn()
  report: Report;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
