import { Body, Controller, Get, Post } from '@nestjs/common';

import { InventoryService } from './inventory.service';

import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  adjustStock(
    @Body()
    dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(dto);
  }

  @Get('movements')
  getInventoryMovements() {
    return this.inventoryService.getInventoryMovements();
  }

  @Get('low-stock')
  getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }
}
