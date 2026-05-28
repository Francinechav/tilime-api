import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

import { InventoryMovementType } from '../../../common/enums/inventory-movement-type.enum';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, (product) => product.inventoryMovements, {
    eager: true,
    onDelete: 'CASCADE',
  })
  product!: Product;

  @Column({
    type: 'enum',
    enum: InventoryMovementType,
  })
  movementType!: InventoryMovementType;

  @Column()
  quantity!: number;

  @Column({
    nullable: true,
  })
  referenceId?: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  performedBy!: User;

  @Column({
    nullable: true,
  })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
