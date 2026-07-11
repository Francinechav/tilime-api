import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { PackagingController } from './packaging.controller';
import { PackagingService } from './packaging.service';

import { PackagingRecord } from './entities/packaging-record.entity';

import { RawHoneyBatch } from '../raw-honey/entities/raw-honey-batch.entity';

import { Product } from '../products/entities/product.entity';

import { User } from '../users/entities/user.entity';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PackagingConsumption } from './entities/packaging-consumption.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PackagingRecord,
      RawHoneyBatch,
      PackagingConsumption,
      Product,
      User,
      InventoryMovement,
    ]),
    AuditLogsModule,
  ],

  controllers: [PackagingController],

  providers: [PackagingService],
})
export class PackagingModule {}
