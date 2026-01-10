// common/utils/user.utils.ts

import { Injectable } from '@nestjs/common';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { Permission } from 'src/users/entity/permissions.entity';
import { Role } from 'src/users/entity/roles.entity';
import { User } from 'src/users/entity/users.entity';
import { RoleUtils } from './role.utils';
import { PermissionUtils } from './permission.utils';

@Injectable()
export class UserUtils {
  constructor(
    private readonly roleUtils: RoleUtils,
    private readonly permissionUtils: PermissionUtils,
  ) {}

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
      roles: (user.roles || []).map(this.roleUtils.mapRoleToDto),
      permissions: (Array.from(permissions) || []).map(this.permissionUtils.mapPermissionToDto),
    };
  };
};
