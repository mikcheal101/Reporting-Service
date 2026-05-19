import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DatabaseType } from '../databasetype.enum';
import { Report } from 'src/reports/entity/report.entity';

@Entity()
export class Connection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: false })
  server: string;

  @Column({ nullable: false })
  port: number;

  @Column({ nullable: false })
  user: string;

  @Column({ nullable: false })
  password: string;

  @Column({ default: false })
  isTestSuccessful: boolean;

  @Column({ nullable: false })
  database: string;

  @Column({ nullable: false })
  databaseType: DatabaseType;

  @OneToMany(() => Report, (report) => report.connection)
  reports: Report[];

  @Column({ nullable: true })
  userId: number;

  @Column({ default: 60000 })
  queryTimeout: number;

  @Column({ default: false })
  cacheEnabled: boolean;

  @Column({ default: 300 })
  cacheTtl: number;

  @Column({ default: false })
  streamEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
