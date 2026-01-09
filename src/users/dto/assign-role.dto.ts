// users/dto/assign-role.dto.ts

import { IsNumber } from "class-validator";

export default class AssignRoleDto {
  @IsNumber()
  userId: number;
  @IsNumber()
  roleId: number;
};
