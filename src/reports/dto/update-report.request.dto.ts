import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateReportRequestDto {
  @IsNumber()
  @IsOptional()
  connectionId: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  queryString?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  reportTypeId: number;
}
