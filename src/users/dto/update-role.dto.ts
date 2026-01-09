// users/dto/update-role.dto.ts

import { IsString } from 'class-validator';
import { PermissionDto } from './permission.dto';

export default class UpdateRoleDto {
  @IsString()
  name: string;

  permissions: PermissionDto[];
}