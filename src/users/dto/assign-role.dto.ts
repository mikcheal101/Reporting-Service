// users/dto/assign-role.dto.ts

import { IsArray, IsNumber } from "class-validator";

export default class AssignRoleDto {
  @IsNumber()
  userId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: Array<number>;
};
