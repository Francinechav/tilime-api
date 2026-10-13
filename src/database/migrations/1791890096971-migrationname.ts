import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationname1791890096971 implements MigrationInterface {
  name = 'Migrationname1791890096971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`product_categories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a75bfadcd8291a0538ab7abfdc\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('SUPER_ADMIN', 'VIEWER') NOT NULL DEFAULT 'VIEWER', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`otpCode\` varchar(255) NULL, \`otpExpiresAt\` timestamp NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`inventory_movements\` (\`id\` varchar(36) NOT NULL, \`movementType\` enum ('INTAKE', 'PACKAGING', 'WEBSITE_ORDER', 'SHOP_DELIVERY', 'STAFF_ALLOCATION', 'WALK_IN_SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT') NOT NULL, \`quantity\` int NOT NULL, \`referenceId\` varchar(255) NULL, \`notes\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`productId\` varchar(36) NULL, \`performedById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`products\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`sku\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`price\` decimal(10,2) NOT NULL, \`stockQuantity\` int NOT NULL DEFAULT '0', \`lowStockLevel\` int NOT NULL DEFAULT '10', \`weight\` decimal(10,2) NULL, \`unit\` varchar(255) NULL, \`imageUrl\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`categoryId\` varchar(36) NULL, UNIQUE INDEX \`IDX_c44ac33a05b144dd0d9ddcf932\` (\`sku\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`packaging_records\` (\`id\` varchar(36) NOT NULL, \`type\` enum ('HONEY', 'PRODUCT') NOT NULL, \`quantityProduced\` int NOT NULL, \`honeyUsedKg\` decimal(10,2) NULL, \`packagedAt\` date NULL, \`notes\` varchar(255) NULL, \`productId\` varchar(36) NULL, \`packagedById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`farmers\` (\`id\` varchar(36) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`phone\` varchar(255) NULL, \`district\` varchar(255) NULL, \`address\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`raw_honey_batches\` (\`id\` varchar(36) NOT NULL, \`batchNumber\` varchar(255) NOT NULL, \`sourceType\` enum ('HARVEST', 'FARMER') NOT NULL, \`quantityKg\` decimal(10,2) NOT NULL, \`remainingQuantityKg\` decimal(10,2) NULL, \`costPerKg\` decimal(10,2) NULL, \`totalCost\` decimal(15,2) NULL, \`notes\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`farmerId\` varchar(36) NULL, UNIQUE INDEX \`IDX_1f901fdb6cdb77d42155fce675\` (\`batchNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`packaging_consumptions\` (\`id\` varchar(36) NOT NULL, \`quantityKg\` decimal(10,2) NOT NULL, \`packagingId\` varchar(36) NULL, \`batchId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`audit_logs\` (\`id\` varchar(36) NOT NULL, \`action\` varchar(255) NOT NULL, \`entityType\` varchar(255) NOT NULL, \`entityId\` varchar(255) NULL, \`performedBy\` varchar(255) NULL, \`metadata\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`before\` json NULL, \`after\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`order_items\` (\`id\` varchar(36) NOT NULL, \`quantity\` int NOT NULL, \`unitPrice\` decimal(10,2) NOT NULL, \`subtotal\` decimal(10,2) NOT NULL, \`orderId\` varchar(36) NULL, \`productId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`orders\` (\`id\` varchar(36) NOT NULL, \`orderNumber\` varchar(255) NOT NULL, \`customerName\` varchar(255) NOT NULL, \`customerPhone\` varchar(255) NOT NULL, \`customerEmail\` varchar(255) NULL, \`subtotal\` decimal(10,2) NOT NULL, \`deliveryFee\` decimal(10,2) NOT NULL DEFAULT '0.00', \`totalAmount\` decimal(10,2) NOT NULL, \`orderStatus\` enum ('PENDING', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'DISPATCHED', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING', \`paymentStatus\` enum ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING', \`deliveryMethod\` enum ('PICKUP', 'DELIVERY') NOT NULL, \`deliveryAddress\` varchar(255) NULL, \`pickupLocation\` varchar(255) NULL, \`notes\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_59b0c3b34ea0fa5562342f2414\` (\`orderNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`payments\` (\`id\` varchar(36) NOT NULL, \`txRef\` varchar(255) NOT NULL, \`paychanguReference\` varchar(255) NULL, \`amount\` decimal(10,2) NOT NULL, \`currency\` varchar(255) NOT NULL DEFAULT 'MWK', \`status\` enum ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING', \`rawResponse\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`orderId\` varchar(36) NULL, UNIQUE INDEX \`IDX_a167f4b14bebbe6e781b7d3ca5\` (\`txRef\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sales_operations\` (\`id\` varchar(36) NOT NULL, \`operationType\` enum ('SHOP_DELIVERY', 'WALK_IN_SALE', 'STAFF_ALLOCATION', 'DAMAGE') NOT NULL, \`quantity\` int NOT NULL, \`unitPrice\` decimal(10,2) NOT NULL DEFAULT '0.00', \`totalAmount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`recipient\` varchar(255) NULL, \`collectedBy\` varchar(255) NULL, \`notes\` varchar(255) NULL, \`operationDate\` date NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`productId\` varchar(36) NULL, \`performedById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`daily_activity_categories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_69599ad1e3d6f8acf0bf8903f7\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`daily_activities\` (\`id\` varchar(36) NOT NULL, \`activityDate\` date NOT NULL, \`location\` varchar(150) NOT NULL, \`activity\` varchar(255) NOT NULL, \`details\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`categoryId\` varchar(36) NOT NULL, \`recordedById\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory_movements\` ADD CONSTRAINT \`FK_05715a7ea47e49653f164c0dd8c\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory_movements\` ADD CONSTRAINT \`FK_a9e4b0ee5aba9e252f583ca21dc\` FOREIGN KEY (\`performedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_ff56834e735fa78a15d0cf21926\` FOREIGN KEY (\`categoryId\`) REFERENCES \`product_categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_records\` ADD CONSTRAINT \`FK_fb5734186170aec5590948f4950\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_records\` ADD CONSTRAINT \`FK_a9e3194d3bb9b6958fd44e1b3af\` FOREIGN KEY (\`packagedById\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`raw_honey_batches\` ADD CONSTRAINT \`FK_b51a8339a77748ab095595bd2cc\` FOREIGN KEY (\`farmerId\`) REFERENCES \`farmers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_consumptions\` ADD CONSTRAINT \`FK_fe76ec5783b58643201c864536e\` FOREIGN KEY (\`packagingId\`) REFERENCES \`packaging_records\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_consumptions\` ADD CONSTRAINT \`FK_10648603c58207ddbcaf0a77e67\` FOREIGN KEY (\`batchId\`) REFERENCES \`raw_honey_batches\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_f1d359a55923bb45b057fbdab0d\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_cdb99c05982d5191ac8465ac010\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` ADD CONSTRAINT \`FK_af929a5f2a400fdb6913b4967e1\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_operations\` ADD CONSTRAINT \`FK_70f3913eaf0a750be6002325c90\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_operations\` ADD CONSTRAINT \`FK_bc8644b76e6c5bc05a253b0da2f\` FOREIGN KEY (\`performedById\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`daily_activities\` ADD CONSTRAINT \`FK_a7e953c118f2c468a1ca01d93fb\` FOREIGN KEY (\`categoryId\`) REFERENCES \`daily_activity_categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`daily_activities\` ADD CONSTRAINT \`FK_77e239a0f07dde8c35a35fc550f\` FOREIGN KEY (\`recordedById\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`daily_activities\` DROP FOREIGN KEY \`FK_77e239a0f07dde8c35a35fc550f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`daily_activities\` DROP FOREIGN KEY \`FK_a7e953c118f2c468a1ca01d93fb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_operations\` DROP FOREIGN KEY \`FK_bc8644b76e6c5bc05a253b0da2f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_operations\` DROP FOREIGN KEY \`FK_70f3913eaf0a750be6002325c90\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_af929a5f2a400fdb6913b4967e1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_cdb99c05982d5191ac8465ac010\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_f1d359a55923bb45b057fbdab0d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_consumptions\` DROP FOREIGN KEY \`FK_10648603c58207ddbcaf0a77e67\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_consumptions\` DROP FOREIGN KEY \`FK_fe76ec5783b58643201c864536e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`raw_honey_batches\` DROP FOREIGN KEY \`FK_b51a8339a77748ab095595bd2cc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_records\` DROP FOREIGN KEY \`FK_a9e3194d3bb9b6958fd44e1b3af\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`packaging_records\` DROP FOREIGN KEY \`FK_fb5734186170aec5590948f4950\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_ff56834e735fa78a15d0cf21926\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory_movements\` DROP FOREIGN KEY \`FK_a9e4b0ee5aba9e252f583ca21dc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory_movements\` DROP FOREIGN KEY \`FK_05715a7ea47e49653f164c0dd8c\``,
    );
    await queryRunner.query(`DROP TABLE \`daily_activities\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_69599ad1e3d6f8acf0bf8903f7\` ON \`daily_activity_categories\``,
    );
    await queryRunner.query(`DROP TABLE \`daily_activity_categories\``);
    await queryRunner.query(`DROP TABLE \`sales_operations\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a167f4b14bebbe6e781b7d3ca5\` ON \`payments\``,
    );
    await queryRunner.query(`DROP TABLE \`payments\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_59b0c3b34ea0fa5562342f2414\` ON \`orders\``,
    );
    await queryRunner.query(`DROP TABLE \`orders\``);
    await queryRunner.query(`DROP TABLE \`order_items\``);
    await queryRunner.query(`DROP TABLE \`audit_logs\``);
    await queryRunner.query(`DROP TABLE \`packaging_consumptions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_1f901fdb6cdb77d42155fce675\` ON \`raw_honey_batches\``,
    );
    await queryRunner.query(`DROP TABLE \`raw_honey_batches\``);
    await queryRunner.query(`DROP TABLE \`farmers\``);
    await queryRunner.query(`DROP TABLE \`packaging_records\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c44ac33a05b144dd0d9ddcf932\` ON \`products\``,
    );
    await queryRunner.query(`DROP TABLE \`products\``);
    await queryRunner.query(`DROP TABLE \`inventory_movements\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a75bfadcd8291a0538ab7abfdc\` ON \`product_categories\``,
    );
    await queryRunner.query(`DROP TABLE \`product_categories\``);
  }
}
