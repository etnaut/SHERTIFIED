import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('system_logs')
export class SystemLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    actor!: string;     // e.g., 'System B', 'PESO', 'Superadmin'

    @Column({ type: 'text' })
    action!: string;    // e.g., 'Shared Data', 'Requested Data', 'Approved Request', 'Activated System'

    @Column({ type: 'text' })
    target!: string;    // e.g., 'To CDEMS', 'From System B (Columns: city, age)', 'System B'

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
