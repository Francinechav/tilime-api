import { IsDateString, IsOptional } from 'class-validator';

export class RevenueQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
