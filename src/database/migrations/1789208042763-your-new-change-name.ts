import { MigrationInterface, QueryRunner } from 'typeorm';

export class YourNewChangeName1789208042763 implements MigrationInterface {
  name = 'YourNewChangeName1789208042763';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sales_operations\` ADD \`operationDate\` date NULL`,
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
      `ALTER TABLE \`sales_operations\` DROP COLUMN \`operationDate\``,
    );
  }
}
