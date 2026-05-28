import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { OrderItem } from './order-item.entity';

import { OrderStatus } from '../../../common/enums/order-status.enum';

import { PaymentStatus } from '../../../common/enums/payment-status.enum';

import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    unique: true,
  })
  orderNumber!: string;

  @Column()
  customerName!: string;

  @Column()
  customerPhone!: string;

  @Column({
    nullable: true,
  })
  customerEmail?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  subtotal!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  deliveryFee!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus!: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
  })
  deliveryMethod!: DeliveryMethod;

  @Column({
    nullable: true,
  })
  deliveryAddress?: string;

  @Column({
    nullable: true,
  })
  pickupLocation?: string;

  @Column({
    nullable: true,
  })
  notes?: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  @CreateDateColumn()
  createdAt!: Date;
}
