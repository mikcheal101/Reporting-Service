// users/dto/role.dto.ts

import { IsNumber, IsString } from 'class-validator';
import PermissionDto from './permission.dto';

export class RoleDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;
  
  createdAt: Date;
  permissions: PermissionDto[];
}