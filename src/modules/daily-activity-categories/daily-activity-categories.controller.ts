import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DailyActivityCategoriesService } from './daily-activity-categories.service';

import { CreateDailyActivityCategoryDto } from './dto/create-daily-activity-category.dto';

import { UpdateDailyActivityCategoryDto } from './dto/update-daily-activity-category.dto';

@Controller('daily-activity-categories')
export class DailyActivityCategoriesController {
  constructor(
    private readonly categoriesService: DailyActivityCategoriesService,
  ) {}

  @Post()
  createCategory(
    @Body()
    dto: CreateDailyActivityCategoryDto,
  ) {
    return this.categoriesService.createCategory(dto);
  }

  @Get()
  findAllCategories() {
    return this.categoriesService.findAllCategories();
  }

  @Get(':id')
  findOneCategory(@Param('id') id: string) {
    return this.categoriesService.findOneCategory(id);
  }

  @Patch(':id')
  updateCategory(
    @Param('id') id: string,

    @Body()
    dto: UpdateDailyActivityCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
