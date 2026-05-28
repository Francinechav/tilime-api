import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProductCategory } from './product-category.entity';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    unique: true,
  })
  sku!: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price!: number;

  @Column({
    default: 0,
  })
  stockQuantity!: number;

  @Column({
    default: 10,
  })
  lowStockLevel!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  weight?: number;

  @Column({
    nullable: true,
  })
  unit?: string;

  @Column({
    nullable: true,
  })
  imageUrl?: string;

  @Column({
    default: true,
  })
  isActive!: boolean;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    eager: true,
  })
  category!: ProductCategory;

  @OneToMany(() => InventoryMovement, (movement) => movement.product)
  inventoryMovements!: InventoryMovement[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
