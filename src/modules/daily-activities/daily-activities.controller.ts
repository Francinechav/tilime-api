import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DailyActivitiesService } from './daily-activities.service';

import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';

import { UpdateDailyActivityDto } from './dto/update-daily-activity.dto';

@Controller('daily-activities')
export class DailyActivitiesController {
  constructor(private readonly activitiesService: DailyActivitiesService) {}

  @Post()
  createActivity(
    @Body()
    dto: CreateDailyActivityDto,
  ) {
    return this.activitiesService.createActivity(dto);
  }

  @Get()
  findAllActivities() {
    return this.activitiesService.findAllActivities();
  }

  @Get(':id')
  findOneActivity(@Param('id') id: string) {
    return this.activitiesService.findOneActivity(id);
  }

  @Patch(':id')
  updateActivity(
    @Param('id') id: string,

    @Body()
    dto: UpdateDailyActivityDto,
  ) {
    return this.activitiesService.updateActivity(id, dto);
  }

  @Delete(':id')
  deleteActivity(@Param('id') id: string) {
    return this.activitiesService.deleteActivity(id);
  }
}
