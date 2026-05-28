import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { UpdateRawHoneyBatchDto } from './dto/update-raw-honey-batch.dto';

import { RawHoneyService } from './raw-honey.service';

import { CreateRawHoneyBatchDto } from './dto/create-raw-honey-batch.dto';

@Controller('raw-honey')
export class RawHoneyController {
  constructor(private readonly rawHoneyService: RawHoneyService) {}

  @Post()
  createBatch(
    @Body()
    dto: CreateRawHoneyBatchDto,
  ) {
    return this.rawHoneyService.createBatch(dto);
  }

  @Get()
  findAllBatches() {
    return this.rawHoneyService.findAllBatches();
  }
  @Patch(':id')
  updateRawHoneyBatch(
    @Param('id') id: string,

    @Body()
    dto: UpdateRawHoneyBatchDto,
  ) {
    return this.rawHoneyService.updateRawHoneyBatch(id, dto);
  }
  @Delete(':id')
  deleteRawHoneyBatch(@Param('id') id: string) {
    return this.rawHoneyService.deleteRawHoneyBatch(id);
  }
}
