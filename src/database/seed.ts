import 'reflect-metadata';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

import { databaseConfig } from '../config/database.config';

import { seedAdmin } from './seeds/admin.seed';

import { seedCategories } from './seeds/categories.seed';

const dataSource = new DataSource({
  ...databaseConfig,
  entities: ['src/**/*.entity.ts'],
} as DataSourceOptions);

async function runSeeds() {
  await dataSource.initialize();

  console.log('Database connected');

  await seedAdmin(dataSource);

  await seedCategories(dataSource);

  console.log('Seeding completed');

  await dataSource.destroy();

  process.exit(0);
}

runSeeds().catch((error) => {
  console.error(error);

  process.exit(1);
});
