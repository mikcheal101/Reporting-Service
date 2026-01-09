// common/utils/user.utils.ts

import { Injectable } from '@nestjs/common';
import { PermissionDto } from 'src/users/dto/permission.dto';
import { RoleDto } from 'src/users/dto/role.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { Permission } from 'src/users/entity/permissions.entity';
import { Role } from 'src/users/entity/roles.entity';
import { User } from 'src/users/entity/users.entity';

@Injectable()
export class UserUtils {
  public mapUserToUserResponseDto = (user: User): UserResponseDto => {
    let permissions: Set<Permission> = new Set([...user.permissions || []]);
    user.roles?.forEach((role: Role) => permissions = new Set([ ...(Array.from(permissions)), ...(role.permissions || []) ]));

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      roles: (user.roles || []).map(this.mapUserRoleToRoleDto),
      permissions: (Array.from(permissions) || []).map(this.mapUserPermissionsToPermissionDto),
    };
  };

  public mapUserRoleToRoleDto = (role: Role): RoleDto => {
    return {
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      permissions: (role.permissions || []).map(this.mapUserPermissionsToPermissionDto),
    };
  };

  public mapUserPermissionsToPermissionDto = (permission: Permission): PermissionDto => {
    return {
      id: permission.id,
      name: permission.name,
      createdAt: permission.createdAt,
    };
  };
};
