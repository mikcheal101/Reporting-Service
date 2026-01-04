import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateConnectionRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  server: string;

  @IsNumber()
  @IsNotEmpty()
  port: number;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  database: string;

  @IsNotEmpty()
  @IsNumber()
  databaseType: number;
}
