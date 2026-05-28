import { Body, Controller, Get, Post } from '@nestjs/common';

import { PackagingService } from './packaging.service';

import { CreatePackagingDto } from './dto/create-packaging.dto';

@Controller('packaging')
export class PackagingController {
  constructor(private readonly packagingService: PackagingService) {}

  @Post()
  packageHoney(
    @Body()
    dto: CreatePackagingDto,
  ) {
    return this.packagingService.packageHoney(dto);
  }

  @Get()
  getPackagingRecords() {
    return this.packagingService.getPackagingRecords();
  }
}
