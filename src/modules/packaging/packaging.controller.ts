import { Body, Controller, Get, Post } from '@nestjs/common';

import { PackagingService } from './packaging.service';

import { CreatePackagingDto } from './dto/create-packaging.dto';
import { Patch, Param } from '@nestjs/common';
import { UpdatePackagingDto } from './dto/update-packaging.dto';

@Controller('packaging')
export class PackagingController {
  constructor(private readonly packagingService: PackagingService) {}

  @Post()
  createPackaging(
    @Body()
    dto: CreatePackagingDto,
  ) {
    return this.packagingService.createPackaging(dto);
  }

  @Get()
  getPackagingRecords() {
    return this.packagingService.getPackagingRecords();
  }
  @Patch(':id')
  updatePackaging(@Param('id') id: string, @Body() dto: UpdatePackagingDto) {
    return this.packagingService.updatePackaging(id, dto);
  }
}
