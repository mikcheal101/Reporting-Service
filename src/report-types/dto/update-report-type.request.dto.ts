import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateReportTypeRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  emailsToNotify: string;

  @IsNumber()
  @IsNotEmpty()
  frequency: number;

  @IsNumber()
  @IsNotEmpty()
  outputType: number;

  @IsString()
  @IsNotEmpty()
  runDate: string;

  @IsString()
  @IsNotEmpty()
  runTime: string;

  @IsDate()
  @IsOptional()
  datetime?: Date;

  @IsOptional()
  @IsEmail({}, { each: true })
  emails?: string[];
}
