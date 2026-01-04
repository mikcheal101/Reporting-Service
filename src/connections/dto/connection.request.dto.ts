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

  @IsString()
  @IsNotEmpty()
  port: string;

  @IsString()
  @IsNotEmpty()
  server: string;

  @IsString()
  @IsNotEmpty()
  user: string;
}
