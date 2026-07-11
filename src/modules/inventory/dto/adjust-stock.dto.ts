import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  productId!: string;

  @IsBoolean()
  increase!: boolean;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsUUID()
  performedBy!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
