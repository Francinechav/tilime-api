import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        console.log('DB_DATABASE =', config.get('DB_DATABASE'));

        return {
          type: 'mysql' as const,

          host: config.get<string>('DB_HOST'),

          port: Number(config.get<string>('DB_PORT')),

          username: config.get<string>('DB_USERNAME'),

          password: config.get<string>('DB_PASSWORD'),

          database: config.get<string>('DB_DATABASE'),

          autoLoadEntities: true,

          synchronize: true,

          migrations: ['dist/database/migrations/*.js'],
        };
      },
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
