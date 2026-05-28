import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RawHoneyBatch } from '../../raw-honey/entities/raw-honey-batch.entity';

@Entity('farmers')
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column({
    nullable: true,
  })
  phone?: string;

  @Column({
    nullable: true,
  })
  district?: string;

  @Column({
    nullable: true,
  })
  address?: string;

  @OneToMany(() => RawHoneyBatch, (batch) => batch.farmer)
  rawHoneyBatches!: RawHoneyBatch[];

  @CreateDateColumn()
  createdAt!: Date;
}
