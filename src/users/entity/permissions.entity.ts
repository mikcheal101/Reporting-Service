import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ onUpdate: 'GETDATE()', nullable: true })
  updatedAt: Date;
}
