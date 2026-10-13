import 'dotenv/config';
import { DataSource } from 'typeorm';

import { PackagingConsumption } from '../modules/packaging/entities/packaging-consumption.entity';
import { PackagingRecord } from '../modules/packaging/entities/packaging-record.entity';

import { AuditLog } from '../modules/audit-logs/entities/audit-log.entity';

import { Payment } from '../modules/payments/entities/payment.entity';

import { SalesOperation } from '../modules/sales-operations/entities/sales-operation.entity';

import { Product } from '../modules/products/entities/product.entity';
import { ProductCategory } from '../modules/products/entities/product-category.entity';

import { RawHoneyBatch } from '../modules/raw-honey/entities/raw-honey-batch.entity';

import { Farmer } from '../modules/farmers/entities/farmer.entity';

import { InventoryMovement } from '../modules/inventory/entities/inventory-movement.entity';

import { User } from '../modules/users/entities/user.entity';

import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { DailyActivity } from '../modules/daily-activities/entities/daily-activity.entity';
import { DailyActivityCategory } from '../modules/daily-activity-categories/entities/daily-activity-category.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,

  database: process.env.DB_DATABASE,

  entities: [
    PackagingConsumption,
    PackagingRecord,
    AuditLog,
    Payment,
    SalesOperation,
    Product,
    ProductCategory,
    RawHoneyBatch,
    Farmer, 
    InventoryMovement,
    User,
    OrderItem,
    Order,
    DailyActivity,
    DailyActivityCategory,
  ],

  migrations: [__dirname + '/migrations/*.js'],

  synchronize: false,
});
