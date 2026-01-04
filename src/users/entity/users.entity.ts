import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './roles.entity';
import { Permission } from './permissions.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: false })
  phoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ nullable: true, onUpdate: 'GETDATE()' })
  updatedAt: Date;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];
}
