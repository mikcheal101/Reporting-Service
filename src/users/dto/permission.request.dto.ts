// users/dto/permission.dto.ts

import { IsNumber } from 'class-validator';

export default class PermissionRequestDto {
  @IsNumber()
  id: number;

  name: string;  
  createdAt: Date;
}