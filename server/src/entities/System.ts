import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: 'systems' })
export class System extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'system_id' })
  id!: number;

  @Column({ name: 'system_name', type: 'text' })
  name!: string;

  @Column({ name: 'api_key', type: 'text', unique: true })
  apiKey!: string;

  @Column({ name: 'status', type: 'text', default: 'inactive' })
  status!: string;

  @Column({ name: 'permissions', type: 'jsonb', nullable: true })
  permissions!: any;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
