import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from './permissions.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ onUpdate: 'GETDATE()', nullable: true })
  updatedAt: Date;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];
}
