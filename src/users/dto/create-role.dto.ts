// users/dto/create-role.dto.ts

import { IsString } from 'class-validator';
import { PermissionDto } from './permission.dto';

export default class CreateRoleDto {
  @IsString()
  name: string;
  permissions: PermissionDto[];
};