import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { Product } from '../products/entities/product.entity';
import { PaymentsModule } from '../payments/payments.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    PaymentsModule,
    AuditLogsModule,
  ],

  controllers: [OrdersController],

  providers: [OrdersService],

  exports: [OrdersService],
})
export class OrdersModule {}
