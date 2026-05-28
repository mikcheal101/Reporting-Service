import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  queryTimeout?: number;

  @IsBoolean()
  @IsOptional()
  cacheEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  cacheTtl?: number;

  @IsBoolean()
  @IsOptional()
  streamEnabled?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
