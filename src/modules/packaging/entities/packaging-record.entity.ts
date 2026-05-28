import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RawHoneyBatch } from '../../raw-honey/entities/raw-honey-batch.entity';

import { Product } from '../../products/entities/product.entity';

import { User } from '../../users/entities/user.entity';

@Entity('packaging_records')
export class PackagingRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RawHoneyBatch, (batch) => batch.packagingRecords, {
    eager: true,
  })
  rawHoneyBatch!: RawHoneyBatch;

  @ManyToOne(() => Product, {
    eager: true,
  })
  product!: Product;

  @Column()
  quantityProduced!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  honeyUsedKg!: number;

  @ManyToOne(() => User, {
    eager: true,
  })
  packagedBy?: User;

  @Column({
    nullable: true,
  })
  notes?: string;

  @CreateDateColumn()
  packagedAt!: Date;
}
