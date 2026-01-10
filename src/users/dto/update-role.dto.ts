// users/dto/update-role.dto.ts

import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import PermissionRequestDto from './permission.request.dto';
import { Type } from 'class-transformer';

export default class UpdateRoleDto {
  @IsNumber()
  id: number;
  
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionRequestDto)
  permissions: PermissionRequestDto[];
}