import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { Order } from '../orders/entities/order.entity';

import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { PackagingRecord } from '../packaging/entities/packaging-record.entity';
import { SalesOperation } from '../sales-operations/entities/sales-operation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      SalesOperation,
      Product,
      OrderItem,
      PackagingRecord,
      InventoryMovement,
      AuditLog,
    ]),
  ],

  controllers: [ReportsController],

  providers: [ReportsService],
})
export class ReportsModule {}
