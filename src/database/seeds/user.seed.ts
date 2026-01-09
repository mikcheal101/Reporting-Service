// database/seeds/user.seed.ts

import { INestApplicationContext, Logger } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "src/users/entity/users.entity";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Role } from "src/users/entity/roles.entity";

export class UserSeed {
  static run = async (applicationContext: INestApplicationContext) => {
    const userRepository = applicationContext.get<Repository<User>>(getRepositoryToken(User));

    const firstName: string = "Super";
    const lastName: string = "Administrator";
    const phoneNumber: string = "+234";
    const username: string = "super-admin@samlemail.com";
    const password: string = "super-admin@samlemail.com||Password@1234567890";
    const hashedPassword: string = await bcrypt.hash(password, Number(process.env.HASHING_ROUNDS));

    // check if a user with the credentials exists
    let existingUser: User = await userRepository.findOne({
      where: { username },
      relations: {
        roles: true,
      }
    });

    if (!existingUser) {
      existingUser = userRepository.create({
        firstName,
        lastName,
        phoneNumber,
        username,
        password: hashedPassword,
      });
    }

    const roleRepository = applicationContext.get<Repository<Role>>(getRepositoryToken(Role));
    const roles: Array<Role> = await roleRepository.find();

    const userRoles: Array<Role> = Array.from(new Set([...(existingUser.roles || []), ...roles]));

    if (userRoles.length > 0) {
      existingUser.roles = userRoles;
      await userRepository.save(existingUser);
    }

    const logger: Logger = new Logger(UserSeed.name);
    logger.log('User Seeding Completed!');
  };
};
