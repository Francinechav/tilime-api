import { Injectable, OnModuleInit } from '@nestjs/common';

import { DataSource } from 'typeorm';

import { seedAdmin } from './seeds/admin.seed';
import { seedCategories } from './seeds/categories.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      console.log('Running seeds...');

      await seedAdmin(this.dataSource);

      await seedCategories(this.dataSource);

      console.log('Seeding completed');
    } catch (error) {
      console.error('Seeding failed:', error);
    }
  }
}
