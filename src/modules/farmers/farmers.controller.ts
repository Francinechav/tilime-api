import {
  Body,
  Patch,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { FarmersService } from './farmers.service';

import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

@Controller('farmers')
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post()
  createFarmer(
    @Body()
    dto: CreateFarmerDto,
  ) {
    return this.farmersService.createFarmer(dto);
  }

  @Get()
  findAllFarmers() {
    return this.farmersService.findAllFarmers();
  }

  @Get(':id')
  findOneFarmer(@Param('id') id: string) {
    return this.farmersService.findOneFarmer(id);
  }
  @Patch(':id')
  updateFarmer(
    @Param('id') id: string,

    @Body()
    dto: UpdateFarmerDto,
  ) {
    return this.farmersService.updateFarmer(id, dto);
  }

  @Delete(':id')
  deleteFarmer(@Param('id') id: string) {
    return this.farmersService.deleteFarmer(id);
  }
}
