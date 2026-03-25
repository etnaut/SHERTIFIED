import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('shared_data')
export class SharedData extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    system_id: number;

    @Column({ type: 'jsonb' })
    payload: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
