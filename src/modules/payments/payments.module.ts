import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { HttpModule } from '@nestjs/axios';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { Payment } from './entities/payment.entity';

import { Order } from '../orders/entities/order.entity';

import { Product } from '../products/entities/product.entity';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Module({
  imports: [
    HttpModule,

    TypeOrmModule.forFeature([
      Payment,
      Order,
      OrderItem,
      Product,
      InventoryMovement,
    ]),
  ],

  controllers: [PaymentsController],

  providers: [PaymentsService],

  exports: [PaymentsService],
})
export class PaymentsModule {}
