import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCollectedByToSalesOperations1789384272600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sales_operations',
      new TableColumn({
        name: 'collectedBy',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sales_operations', 'collectedBy');
  }
}
