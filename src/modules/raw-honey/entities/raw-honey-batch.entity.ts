import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Farmer } from '../../farmers/entities/farmer.entity';

import { PackagingRecord } from '../../packaging/entities/packaging-record.entity';

import { RawHoneySourceType } from '../../../common/enums/raw-honey-source.enum';

@Entity('raw_honey_batches')
export class RawHoneyBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    unique: true,
  })
  batchNumber!: string;

  @Column({
    type: 'enum',
    enum: RawHoneySourceType,
  })
  sourceType!: RawHoneySourceType;

  @ManyToOne(() => Farmer, {
    nullable: true,
    eager: true,
  })
  farmer?: Farmer;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  quantityKg!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  remainingQuantityKg!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  costPerKg?: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalCost?: number;

  @Column({
    nullable: true,
  })
  notes?: string;

  @OneToMany(() => PackagingRecord, (record) => record.rawHoneyBatch)
  packagingRecords!: PackagingRecord[];

  @CreateDateColumn()
  createdAt!: Date;
}
