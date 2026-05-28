import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';

import { PaymentStatus } from '../../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, {
    eager: true,
  })
  order!: Order;

  @Column({
    unique: true,
  })
  txRef!: string;

  @Column({
    nullable: true,
  })
  paychanguReference?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount!: number;

  @Column({
    default: 'MWK',
  })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'json',
    nullable: true,
  })
  rawResponse?: any;

  @CreateDateColumn()
  createdAt!: Date;
}
