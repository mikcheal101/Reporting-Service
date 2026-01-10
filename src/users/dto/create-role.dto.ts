// users/dto/create-role.dto.ts

import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import PermissionRequestDto from './permission.request.dto';

export default class CreateRoleDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionRequestDto)
  permissions: PermissionRequestDto[];
};