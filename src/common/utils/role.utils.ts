// common/utils/role.utils.ts

import { RoleDto } from "src/users/dto/role.dto";
import { Role } from "src/users/entity/roles.entity";
import { PermissionUtils } from "./permission.utils";
import { Injectable } from "@nestjs/common";
import { Permission } from "src/users/entity/permissions.entity";
import { PermissionDto } from "src/users/dto/permission.dto";

@Injectable()
export class RoleUtils {
  constructor(private readonly permissionUtils: PermissionUtils) { }

  public mapRoleToDto = (role: Role): RoleDto => {

    const permissions: Array<PermissionDto> = [];
    for (let permission of (role.permissions || [])) {
      console.log('mapping permission: ', permission);
      this.permissionUtils.mapPermissionToDto(permission);
    }

    return {
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      permissions,
    };
  }
};
