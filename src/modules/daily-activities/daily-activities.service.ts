import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DailyActivity } from './entities/daily-activity.entity';

import { DailyActivityCategory } from '../daily-activity-categories/entities/daily-activity-category.entity';

import { User } from '../users/entities/user.entity';

import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';

import { UpdateDailyActivityDto } from './dto/update-daily-activity.dto';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DailyActivitiesService {
  constructor(
    @InjectRepository(DailyActivity)
    private readonly activitiesRepository: Repository<DailyActivity>,

    @InjectRepository(DailyActivityCategory)
    private readonly categoriesRepository: Repository<DailyActivityCategory>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createActivity(dto: CreateDailyActivityDto): Promise<DailyActivity> {
    const category = await this.categoriesRepository.findOne({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Daily activity category not found');
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: dto.recordedBy,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activity = this.activitiesRepository.create({
      activityDate: new Date(dto.activityDate),

      category,

      location: dto.location.trim(),

      activity: dto.activity.trim(),

      details: dto.details?.trim() || undefined,

      recordedBy: user,
    });

    const savedActivity = await this.activitiesRepository.save(activity);

    await this.auditLogsService.createLog({
      action: 'CREATE_DAILY_ACTIVITY',

      entityType: 'DAILY_ACTIVITY',

      entityId: savedActivity.id,

      performedBy: user.email,

      before: {},

      after: {
        activityDate: dto.activityDate,
        category: category.name,
        location: savedActivity.location,
        activity: savedActivity.activity,
        details: savedActivity.details,
      },

      metadata: {
        categoryId: category.id,
      },
    });

    return savedActivity;
  }

  async findAllActivities(): Promise<DailyActivity[]> {
    return this.activitiesRepository.find({
      order: {
        activityDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async findOneActivity(id: string): Promise<DailyActivity> {
    const activity = await this.activitiesRepository.findOne({
      where: {
        id,
      },
    });

    if (!activity) {
      throw new NotFoundException('Daily activity not found');
    }

    return activity;
  }

  async updateActivity(
    id: string,
    dto: UpdateDailyActivityDto,
  ): Promise<DailyActivity> {
    const activity = await this.findOneActivity(id);

    const category = await this.categoriesRepository.findOne({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Daily activity category not found');
    }

    const before = {
      activityDate: activity.activityDate,

      category: activity.category.name,

      location: activity.location,

      activity: activity.activity,

      details: activity.details,
    };

    activity.activityDate = new Date(dto.activityDate);

    activity.category = category;

    activity.location = dto.location.trim();

    activity.activity = dto.activity.trim();

    activity.details = dto.details?.trim() || undefined;

    const updatedActivity = await this.activitiesRepository.save(activity);

    await this.auditLogsService.createLog({
      action: 'UPDATE_DAILY_ACTIVITY',

      entityType: 'DAILY_ACTIVITY',

      entityId: updatedActivity.id,

      performedBy: updatedActivity.recordedBy.email,

      before,

      after: {
        activityDate: dto.activityDate,

        category: category.name,

        location: updatedActivity.location,

        activity: updatedActivity.activity,

        details: updatedActivity.details,
      },

      metadata: {
        categoryId: category.id,
      },
    });

    return updatedActivity;
  }

  async deleteActivity(id: string) {
    const activity = await this.findOneActivity(id);

    await this.auditLogsService.createLog({
      action: 'DELETE_DAILY_ACTIVITY',

      entityType: 'DAILY_ACTIVITY',

      entityId: activity.id,

      performedBy: activity.recordedBy.email,

      before: {
        activityDate: activity.activityDate,

        category: activity.category.name,

        location: activity.location,

        activity: activity.activity,

        details: activity.details,
      },

      after: {},

      metadata: {
        categoryId: activity.category.id,
      },
    });

    await this.activitiesRepository.remove(activity);

    return {
      message: 'Daily activity deleted successfully',
    };
  }
}
