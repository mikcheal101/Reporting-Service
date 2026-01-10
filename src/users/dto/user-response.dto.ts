// users/dto/user-response.dto.ts

import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { RoleDto } from './role.dto';
import PermissionDto from './permission.dto';

export class UserResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  middleName?: string;

  @IsString()
  phoneNumber: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  lastLogin?: Date;
  
  createdAt: Date;
  roles: RoleDto[];
  permissions: PermissionDto[];
};
