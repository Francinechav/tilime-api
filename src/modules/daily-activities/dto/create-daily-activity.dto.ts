import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDailyActivityDto {
  @IsDateString()
  activityDate!: string;

  @IsUUID()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  activity!: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsUUID()
  recordedBy!: string;
}
