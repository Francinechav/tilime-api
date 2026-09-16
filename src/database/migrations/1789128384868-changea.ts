import { MigrationInterface, QueryRunner } from 'typeorm';

export class Changea1789128384868 implements MigrationInterface {
  name = 'Changea1789128384868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`packaging_records\`
      ADD COLUMN \`packagedAt\` date NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`packaging_records\`
      DROP COLUMN \`packagedAt\`
    `);
  }
}
