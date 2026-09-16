import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DailyActivity } from './entities/daily-activity.entity';

import { DailyActivityCategory } from '../daily-activity-categories/entities/daily-activity-category.entity';

import { User } from '../users/entities/user.entity';

import { DailyActivitiesController } from './daily-activities.controller';

import { DailyActivitiesService } from './daily-activities.service';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyActivity, DailyActivityCategory, User]),

    AuditLogsModule,
  ],

  controllers: [DailyActivitiesController],

  providers: [DailyActivitiesService],

  exports: [DailyActivitiesService],
})
export class DailyActivitiesModule {}
