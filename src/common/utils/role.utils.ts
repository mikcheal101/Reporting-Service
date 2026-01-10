// common/utils/role.utils.ts

import { RoleDto } from "src/users/dto/role.dto";
import { Role } from "src/users/entity/roles.entity";
import { PermissionUtils } from "./permission.utils";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RoleUtils {
  constructor(private readonly permissionUtils: PermissionUtils) { }

  public mapRoleToDto = (role: Role): RoleDto => {
    return {
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      permissions: role.permissions?.map(this.permissionUtils.mapPermissionToDto),
    };
  }
};
