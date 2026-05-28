import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement, Product, User]),
    AuditLogsModule,
  ],

  controllers: [InventoryController],

  providers: [InventoryService],

  exports: [InventoryService],
})
export class InventoryModule {}
