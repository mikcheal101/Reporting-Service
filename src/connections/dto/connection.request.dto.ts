import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export abstract class ConnectionRequestDto {
  @IsString()
  @IsNotEmpty()
  database: string;

  @IsNumber()
  @IsNotEmpty()
  databaseType: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNumber()
  @IsNotEmpty()
  port: number;

  @IsString()
  @IsNotEmpty()
  server: string;

  @IsString()
  @IsNotEmpty()
  user: string;
}
