// users/dto/permission.dto.ts

import { IsDateString, IsNumber, IsString } from 'class-validator';

export default class PermissionDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;
  
  @IsDateString()
  createdAt: Date;
}