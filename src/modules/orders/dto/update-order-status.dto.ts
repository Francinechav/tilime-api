import { IsEnum } from 'class-validator';

import { OrderStatus } from '../../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: 'Invalid order status',
  })
  status!: OrderStatus;
}
