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

export class UpdatePackagingDto {
  @IsEnum(PackagingType)
  type!: PackagingType;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  honeyUsedKg?: number;

  @IsNumber()
  @Min(1)
  quantityProduced!: number;

  @IsDateString()
  packagedAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
