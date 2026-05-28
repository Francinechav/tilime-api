import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { UsersModule } from './modules/users/users.module';
import { FarmersModule } from './modules/farmers/farmers.module';
import { RawHoneyModule } from './modules/raw-honey/raw-honey.module';
import { PackagingModule } from './modules/packaging/packaging.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SalesOperationsModule } from './modules/sales-operations/sales-operations.module';
import { EmailModule } from './modules/emails/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql' as const,

        host: process.env.DB_HOST,

        port: Number(process.env.DB_PORT),

        username: process.env.DB_USERNAME,

        password: process.env.DB_PASSWORD,

        database: process.env.DB_DATABASE,

        autoLoadEntities: true,

        synchronize: true,

        migrations: ['dist/database/migrations/*.js'],
      }),
    }),

    UsersModule,

    ProductsModule,

    InventoryModule,

    FarmersModule,

    RawHoneyModule,

    PackagingModule,

    PaymentsModule,
    OrdersModule,

    AuthModule,

    ReportsModule,
    UploadsModule,
    AuditLogsModule,
    SalesOperationsModule,
    EmailModule,
  ],
})
export class AppModule {}
