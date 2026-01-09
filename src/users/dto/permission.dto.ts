// users/dto/permission.dto.ts

import { IsNumber, IsString } from 'class-validator';

export class PermissionDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;
  
  createdAt: Date;
}