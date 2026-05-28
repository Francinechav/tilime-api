import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { RawHoneySourceType } from '../../../common/enums/raw-honey-source.enum';

export class CreateRawHoneyBatchDto {
  @IsString()
  batchNumber!: string;

  @IsEnum(RawHoneySourceType)
  sourceType!: RawHoneySourceType;

  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @IsNumber()
  @Min(1)
  quantityKg!: number;

  @IsOptional()
  @IsNumber()
  costPerKg?: number;

  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
