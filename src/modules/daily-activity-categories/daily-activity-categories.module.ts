import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DailyActivityCategory } from './entities/daily-activity-category.entity';

import { DailyActivityCategoriesController } from './daily-activity-categories.controller';

import { DailyActivityCategoriesService } from './daily-activity-categories.service';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyActivityCategory]), AuditLogsModule],

  controllers: [DailyActivityCategoriesController],

  providers: [DailyActivityCategoriesService],

  exports: [DailyActivityCategoriesService],
})
export class DailyActivityCategoriesModule {}
