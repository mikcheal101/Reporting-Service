// users/dto/update-user.dto.ts

import { IsOptional, IsString } from 'class-validator';

export default class UpdateUserDto {
  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  middleName?: string;

  @IsString()
  phone: string;
}