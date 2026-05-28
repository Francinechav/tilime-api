import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePackagingDto {
  @IsUUID()
  rawHoneyBatchId!: string;

  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantityProduced!: number;

  @IsNumber()
  @Min(0.1)
  honeyUsedKg!: number;

  @IsUUID()
  packagedBy!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
