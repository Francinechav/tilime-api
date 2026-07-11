import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import { PackagingRecord } from './packaging-record.entity';
import { RawHoneyBatch } from '../../raw-honey/entities/raw-honey-batch.entity';

@Entity('packaging_consumptions')
export class PackagingConsumption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PackagingRecord, (packaging) => packaging.consumptions, {
    onDelete: 'CASCADE',
  })
  packaging!: PackagingRecord;

  @ManyToOne(() => RawHoneyBatch, {
    eager: true,
  })
  batch!: RawHoneyBatch;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  quantityKg!: number;
}
