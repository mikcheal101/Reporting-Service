import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/users.entity';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserUtils } from 'src/common/utils/user.utils';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { ERRORS } from '../common/constants/error-messages.constant';

@Injectable()
export class UsersService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly userUtils: UserUtils,
  ) {
    this.logger = new Logger(UsersService.name);
  }

  private findUserByIdAsync = async (id: number): Promise<User> => {
    try {
      const user: User = await this.usersRepository.findOne({
        where: {
          id,
          isActive: true,
        },
        relations: {
          roles: {
            permissions: true,
          },
          permissions: true,
        },
      });
      if (!user) {
        throw new NotFoundException(ERRORS.USER_NOT_FOUND);
      }
      return user;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public findOneAsync = async (username: string): Promise<User | null> => {
    return this.usersRepository.findOne({
      where: {
        username,
        isActive: true,
      },
      relations: {
        roles: {
          permissions: true,
        },
        permissions: true,
      },
      select: {
        id: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phoneNumber: true,
        isActive: true,
        permissions: {
          id: true,
          name: true,
        },
        roles: {
          id: true,
          name: true,
          permissions: {
            id: true,
            name: true,
          },
        },
      },
    });
  };

  public findAsync = async (): Promise<UserResponseDto[]> => {
    try {
      const users: User[] = await this.usersRepository.find({
        where: {
          isActive: true,
        },
        relations: {
          roles: {
            permissions: true,
          },
          permissions: true,
        },
      });
      return users.map(this.userUtils.mapUserToUserResponseDto);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public findOneByIdAsync = async (id: number): Promise<UserResponseDto> => {
    try {
      const user: User = await this.findUserByIdAsync(id);
      return this.userUtils.mapUserToUserResponseDto(user);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public createUserAsync = async (
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    middleName?: string,
  ): Promise<UserResponseDto> => {
    try {
      const existingUser: User = await this.findOneAsync(username);

      if (existingUser) {
        return this.userUtils.mapUserToUserResponseDto(existingUser);
      }

      const hashedPassword: string = await bcrypt.hash(
        password,
        Number(process.env.HASHING_ROUNDS),
      );

      const user: User = this.usersRepository.create({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        middleName,
        phoneNumber,
      });

      const createdUser = await this.usersRepository.save(user);

      return this.userUtils.mapUserToUserResponseDto(createdUser);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public updateUserAsync = async (
    id: number,
    username: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    middleName?: string,
  ): Promise<UserResponseDto> => {
    try {
      const user: User = await this.findUserByIdAsync(id);
      if (!user) {
        throw new NotFoundException(ERRORS.USER_NOT_FOUND);
      }

      user.username = username;
      user.firstName = firstName;
      user.lastName = lastName;
      user.middleName = middleName;
      user.phoneNumber = phoneNumber;

      const updatedUser = await this.usersRepository.save(user);

      return this.userUtils.mapUserToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public deleteUserAsync = async (id: number): Promise<boolean> => {
    try {
      const user: User = await this.findUserByIdAsync(id);
      if (!user) {
        throw new NotFoundException(ERRORS.USER_NOT_FOUND);
      }

      await this.usersRepository.delete(id);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public changePasswordAsync = async (
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const user: User = await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.id = :id', { id })
        .andWhere('user.isActive = :isActive', { isActive: true })
        .getOne();

      if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

      const isMatched: boolean = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isMatched)
        throw new UnauthorizedException('Current password is incorrect');

      const hashedPassword: string = await bcrypt.hash(
        newPassword,
        Number(process.env.HASHING_ROUNDS),
      );
      await this.usersRepository.update(id, { password: hashedPassword });

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public assignRoleAsync = async (
    id: number,
    roleIds: Array<number>,
  ): Promise<boolean> => {
    try {
      if (!roleIds.length)
        throw new BadRequestException(ERRORS.NO_ROLES_SELECTED);

      // fetch the user and role
      const user: User = await this.usersRepository.findOne({
        where: { id, isActive: true },
        relations: {
          roles: {
            permissions: true,
          },
          permissions: true,
        },
      });
      if (!user) throw new NotFoundException(ERRORS.USER_WITH_ID_NOT_FOUND(id));

      // Fetch the roles to assign
      const rolesToAssign: Array<Role> = await this.rolesRepository.findBy({
        id: In(roleIds),
      });

      // Prevent adding super admin rights to a user
      const tryingToCreateSuperAdmin: boolean = rolesToAssign.some(
        (role: Role) => role.name.toLowerCase() === 'super-admin',
      );
      if (tryingToCreateSuperAdmin)
        throw new ForbiddenException(ERRORS.CANNOT_ASSIGN_SUPER_ADMIN);

      // Prevent removing super admin rights from an existing super admin
      let isRemovingSuperAdminRights: boolean = user.roles.some(
        (role: Role) => role.name.toLowerCase() === 'super-admin',
      );
      isRemovingSuperAdminRights =
        isRemovingSuperAdminRights &&
        !rolesToAssign.some(
          (role: Role) => role.name.toLowerCase() === 'super-admin',
        );
      if (isRemovingSuperAdminRights)
        throw new ForbiddenException(ERRORS.CANNOT_REMOVE_SUPER_ADMIN);

      // assign new roles
      rolesToAssign.forEach((role: Role) => {
        if (!user.roles.some((userRole: Role) => userRole.id === role.id))
          user.roles.push(role);
      });

      await this.usersRepository.save(user);
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public assignPermissionAsync = async (
    id: number,
    permissionId: number,
  ): Promise<boolean> => {
    try {
      // fetch the user and permission
      const user: User = await this.usersRepository.findOne({
        where: { id, isActive: true },
        relations: {
          permissions: true,
        },
      });
      if (!user) throw new NotFoundException(ERRORS.USER_WITH_ID_NOT_FOUND(id));

      const permission: Permission = await this.permissionsRepository.findOne({
        where: { id: permissionId },
      });
      if (!permission)
        throw new NotFoundException(ERRORS.PERMISSION_NOT_FOUND(permissionId));

      const relationshipExists: boolean = user.permissions.some(
        (searchedPermission: Permission) =>
          searchedPermission.id === permission.id,
      );
      if (relationshipExists) return true;

      user.permissions.push(permission);
      await this.usersRepository.save(user);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };
}
