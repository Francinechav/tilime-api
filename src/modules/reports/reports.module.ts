import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { PackagingRecord } from '../packaging/entities/packaging-record.entity';
import { SalesOperation } from '../sales-operations/entities/sales-operation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { RawHoneyBatch } from '../raw-honey/entities/raw-honey-batch.entity';
import { DailyActivity } from '../daily-activities/entities/daily-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      PackagingRecord,
      SalesOperation,
      InventoryMovement,
      AuditLog,
      RawHoneyBatch,
      DailyActivity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
