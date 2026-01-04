import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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

  @Column({ default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ onUpdate: 'GETDATE()', nullable: true })
  updatedAt: Date;
}
