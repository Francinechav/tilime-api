import { Body, Controller, Get, Post } from '@nestjs/common';

import { SalesOperationsService } from './sales-operations.service';

import { CreateSalesOperationDto } from './dto/create-sales-operation.dto';
import { Patch, Param } from '@nestjs/common';
import { UpdateSalesOperationDto } from './dto/update-sales-operation.dto';

@Controller('sales-operations')
export class SalesOperationsController {
  constructor(
    private readonly salesOperationsService: SalesOperationsService,
  ) {}

  @Post()
  createOperation(
    @Body()
    dto: CreateSalesOperationDto,
  ) {
    return this.salesOperationsService.createOperation(dto);
  }

  @Get()
  findAll() {
    return this.salesOperationsService.findAll();
  }

  @Get('revenue')
  getRevenue() {
    return this.salesOperationsService.getOperationalRevenue();
  }
  @Patch(':id')
  updateOperation(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOperationDto,
  ) {
    return this.salesOperationsService.updateOperation(id, dto);
  }
}
