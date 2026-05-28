import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { SalesOperation } from './entities/sales-operation.entity';

import { Product } from '../products/entities/product.entity';

import { User } from '../users/entities/user.entity';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { SalesOperationsService } from './sales-operations.service';

import { SalesOperationsController } from './sales-operations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOperation,

      Product,

      User,

      InventoryMovement,
    ]),
  ],

  providers: [SalesOperationsService],

  controllers: [SalesOperationsController],
})
export class SalesOperationsModule {}
