import {
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';

class WebsiteOrderItemDto {
  @IsUUID()
  productId!: string;

  @Min(1)
  quantity!: number;
}

export class CreateWebsiteOrderDto {
  @IsString()
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  customerPhone!: string;

  @IsString()
  deliveryAddress!: string;

  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => WebsiteOrderItemDto)
  items!: WebsiteOrderItemDto[];
}
