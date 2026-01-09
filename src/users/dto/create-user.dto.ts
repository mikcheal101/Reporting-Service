// users/dto/create-user.dto.ts

import { IsOptional, IsString } from 'class-validator';

export default class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  middleName?: string;

  @IsString()
  phone: string;
}