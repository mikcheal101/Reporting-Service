// users/dto/assign-permission.dto.ts

import { IsNumber } from "class-validator";

export default class AssignPermissionDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  permissionId: number;
};
