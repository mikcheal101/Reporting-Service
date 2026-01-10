// database/seeds/role.seed.ts

import { INestApplicationContext, Logger } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Permission } from "src/users/entity/permissions.entity";
import { Role } from "src/users/entity/roles.entity";
import { Repository } from "typeorm";

export class RoleSeed {
  static run = async (applicationContext: INestApplicationContext) => {
    const roleRepository = applicationContext.get<Repository<Role>>(getRepositoryToken(Role));

    const name = 'super-admin'.toLowerCase();
    let superAdmin: Role = await roleRepository.findOne({
      where: { name },
      relations: {
        permissions: true,
      }
    });

    if (!superAdmin) {
      superAdmin = roleRepository.create({ name });
    }

    // assign all the permissions to the super admin
    const permissionRepository = applicationContext.get<Repository<Permission>>(getRepositoryToken(Permission));
    const permissions: Array<Permission> = await permissionRepository.find();
    
    superAdmin.permissions = Array.from(new Set([ ...(superAdmin.permissions || []), ...permissions ]));

    await roleRepository.save(superAdmin);

    const logger: Logger = new Logger(RoleSeed.name);
    logger.log('Roles Seeding Completed!');
  };
};
