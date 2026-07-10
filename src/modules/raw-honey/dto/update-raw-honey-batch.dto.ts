import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateRawHoneyBatchDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsUUID()
  farmerId?: string;

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
