import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DailyActivityCategory } from './entities/daily-activity-category.entity';

import { CreateDailyActivityCategoryDto } from './dto/create-daily-activity-category.dto';

import { UpdateDailyActivityCategoryDto } from './dto/update-daily-activity-category.dto';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DailyActivityCategoriesService {
  constructor(
    @InjectRepository(DailyActivityCategory)
    private readonly categoriesRepository: Repository<DailyActivityCategory>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createCategory(
    dto: CreateDailyActivityCategoryDto,
  ): Promise<DailyActivityCategory> {
    const name = dto.name.trim();

    const existing = await this.categoriesRepository.findOne({
      where: { name },
    });

    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }

    const category = this.categoriesRepository.create({
      name,
      description: dto.description?.trim() || undefined,
    });

    const savedCategory = await this.categoriesRepository.save(category);

    await this.auditLogsService.createLog({
      action: 'CREATE_DAILY_ACTIVITY_CATEGORY',

      entityType: 'DAILY_ACTIVITY_CATEGORY',

      entityId: savedCategory.id,

      metadata: {
        name: savedCategory.name,
        description: savedCategory.description,
      },
    });

    return savedCategory;
  }

  async findAllCategories(): Promise<DailyActivityCategory[]> {
    return this.categoriesRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOneCategory(id: string): Promise<DailyActivityCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Daily activity category not found');
    }

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateDailyActivityCategoryDto,
  ): Promise<DailyActivityCategory> {
    const category = await this.findOneCategory(id);

    const name = dto.name.trim();

    const existing = await this.categoriesRepository.findOne({
      where: { name },
    });

    if (existing && existing.id !== category.id) {
      throw new ConflictException('A category with this name already exists');
    }

    const before = {
      name: category.name,
      description: category.description,
    };

    category.name = name;
    category.description = dto.description?.trim() || undefined;

    const updatedCategory = await this.categoriesRepository.save(category);

    await this.auditLogsService.createLog({
      action: 'UPDATE_DAILY_ACTIVITY_CATEGORY',

      entityType: 'DAILY_ACTIVITY_CATEGORY',

      entityId: updatedCategory.id,

      before,

      after: {
        name: updatedCategory.name,
        description: updatedCategory.description,
      },
    });

    return updatedCategory;
  }

  async deleteCategory(id: string) {
    const category = await this.findOneCategory(id);

    await this.auditLogsService.createLog({
      action: 'DELETE_DAILY_ACTIVITY_CATEGORY',

      entityType: 'DAILY_ACTIVITY_CATEGORY',

      entityId: category.id,

      before: {
        name: category.name,
        description: category.description,
      },
    });

    await this.categoriesRepository.remove(category);

    return {
      message: 'Daily activity category deleted successfully',
    };
  }
}
