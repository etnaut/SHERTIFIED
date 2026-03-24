import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: 'user_tbl' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  id!: number;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'user_name', type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'role', type: 'varchar', length: 50 })
  role!: string;

  @Column({ name: 'status', type: 'boolean', default: true })
  isActive!: boolean;
}
