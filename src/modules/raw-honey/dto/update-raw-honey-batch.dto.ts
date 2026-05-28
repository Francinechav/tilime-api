import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRawHoneyBatchDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  sourceLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
