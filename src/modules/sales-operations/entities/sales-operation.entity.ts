import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { User } from '../../users/entities/user.entity';

import { SalesOperationType } from '../../../common/enums/sales-operation-type.enum';

@Entity('sales_operations')
export class SalesOperation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, {
    eager: true,
  })
  product!: Product;

  @Column({
    type: 'enum',

    enum: SalesOperationType,
  })
  operationType!: SalesOperationType;

  @Column()
  quantity!: number;

  @Column({
    type: 'decimal',

    precision: 10,

    scale: 2,

    default: 0,
  })
  unitPrice!: number;

  @Column({
    type: 'decimal',

    precision: 10,

    scale: 2,

    default: 0,
  })
  totalAmount!: number;

  @Column({
    nullable: true,
  })
  recipient?: string;

  @Column({
    nullable: true,
  })
  notes?: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  performedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
