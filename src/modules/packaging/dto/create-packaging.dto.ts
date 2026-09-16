import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { PackagingType } from '../../../common/enums/packaging-type.enum';

export class CreatePackagingDto {
  @IsEnum(PackagingType)
  type!: PackagingType;

  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantityProduced!: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  honeyUsedKg?: number;

  @IsUUID()
  packagedBy!: string;

  @IsDateString()
  packagedAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
