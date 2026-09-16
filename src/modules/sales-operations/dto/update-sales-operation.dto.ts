import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { SalesOperationType } from '../../../common/enums/sales-operation-type.enum';

export class UpdateSalesOperationDto {
  @IsUUID()
  productId!: string;

  @IsEnum(SalesOperationType)
  operationType!: SalesOperationType;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsDateString()
  operationDate!: string;

  @IsOptional()
  @IsString()
  recipient?: string;
  @IsOptional()
  @IsString()
  collectedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
