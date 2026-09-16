import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { CreateWebsiteOrderDto } from './dto/create-website-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(
    @Body()
    dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  findAllOrders() {
    return this.ordersService.findAllOrders();
  }

  @Get('recent')
  getRecentOrders() {
    return this.ordersService.getRecentOrders();
  }

  @Get(':id')
  findOneOrder(@Param('id') id: string) {
    return this.ordersService.findOneOrder(id);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') id: string,

    @Body()
    dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }

  @Post('website')
  createWebsiteOrder(
    @Body()
    dto: CreateWebsiteOrderDto,
  ) {
    return this.ordersService.createWebsiteOrder(dto);
  }
}
