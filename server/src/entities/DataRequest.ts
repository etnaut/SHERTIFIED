import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, BaseEntity } from "typeorm";
import { System } from "./System";

@Entity()
export class DataRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  requester_system_id!: number;

  @Column()
  target_system_id!: number;

  @Column('json')
  requested_columns!: string[];

  @Column({ default: 'pending' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => System)
  @JoinColumn({ name: "requester_system_id" })
  requester!: System;

  @ManyToOne(() => System)
  @JoinColumn({ name: "target_system_id" })
  target!: System;
}
