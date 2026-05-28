import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  action!: string;

  @Column()
  entityType!: string;

  @Column({
    nullable: true,
  })
  entityId?: string;

  @Column({
    nullable: true,
  })
  performedBy?: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({
    type: 'json',
    nullable: true,
  })
  before?: Record<string, unknown>;

  @Column({
    type: 'json',
    nullable: true,
  })
  after?: Record<string, unknown>;
}
