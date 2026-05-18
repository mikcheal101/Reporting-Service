// database/seeds/permission.seed.ts

import { INestApplicationContext, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from 'src/users/entity/permissions.entity';
import { In, Repository } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

export class PermissionSeed {
  static run = async (applicationContext: INestApplicationContext) => {
    const repository = applicationContext.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );

    const permissions: Array<string> = [...PERMISSIONS];

    // fetch existing permissions
    const existingPermissions: Array<Permission> = await repository.find({
      where: { name: In(permissions) },
    });
    const existingPermissionNames: Array<string> = existingPermissions.map(
      (permission: Permission) => permission.name,
    );

    // insert missing permissions
    const draftedPermissions = permissions
      .filter((name: string) => !existingPermissionNames.includes(name))
      .map((name: string) => repository.create({ name }));

    if (draftedPermissions.length > 0) repository.save(draftedPermissions);

    const logger: Logger = new Logger(PermissionSeed.name);
    logger.log('Permissions Seeding Completed!');
  };
}
