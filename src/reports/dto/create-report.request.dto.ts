import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReportRequestDto {
  @IsNumber()
  @IsNotEmpty()
  connectionId: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  reportTypeId: number;
}
