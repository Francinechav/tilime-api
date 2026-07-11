import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { User } from '../../users/entities/user.entity';
import { PackagingType } from '../../../common/enums/packaging-type.enum';

import { OneToMany } from 'typeorm';
import { PackagingConsumption } from './packaging-consumption.entity';

@Entity('packaging_records')
export class PackagingRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({
    type: 'enum',
    enum: PackagingType,
  })
  type!: PackagingType;

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
    nullable: true,
  })
  honeyUsedKg?: number;
  @ManyToOne(() => User, {
    eager: true,
  })
  packagedBy?: User;

  @OneToMany(
    () => PackagingConsumption,
    (consumption) => consumption.packaging,
    {
      cascade: true,
    },
  )
  consumptions!: PackagingConsumption[];
  @Column({
    nullable: true,
  })
  notes?: string;

  @CreateDateColumn()
  packagedAt!: Date;
}
