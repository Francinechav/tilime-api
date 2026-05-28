import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { InventoryMovementType } from '../../../common/enums/inventory-movement-type.enum';

export class AdjustStockDto {
  @IsUUID()
  productId!: string;

  @IsEnum(InventoryMovementType)
  movementType!: InventoryMovementType;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsUUID()
  performedBy!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
