// common/utils/permission.utils.ts

import { Injectable } from "@nestjs/common";
import { PermissionDto } from "src/users/dto/permission.dto";
import { Permission } from "src/users/entity/permissions.entity";

@Injectable()
export class PermissionUtils {
  public mapPermissionToDto = (permission: Permission): PermissionDto => {
    return {
      id: permission.id,
      name: permission.name,
      createdAt: permission.createdAt,
    };
  }
};
