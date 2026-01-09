import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserUtils } from 'src/common/utils/user.utils';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';

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
        }
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public findOneAsync = async (username: string): Promise<User | null> => {
    return this.usersRepository.findOne({
      where: {
        username,
        isActive: true,
      }
    });
  }

  public findAsync = async (): Promise<UserResponseDto[]> => {
    try {
      const users: User[] = await this.usersRepository.find({
        where: {
          isActive: true,
        },
        relations: {
          roles: true,
          permissions: true,
        }
      });
      return users.map(this.userUtils.mapUserToUserResponseDto);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public findOneByIdAsync = async (id: number): Promise<UserResponseDto> => {
    try {
      const user: User = await this.findUserByIdAsync(id);
      return this.userUtils.mapUserToUserResponseDto(user);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

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

      const hashedPassword: string = await bcrypt.hash(password, Number(process.env.HASHING_ROUNDS));

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
      throw new Error(error.message);
    }
  }

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
        throw new Error('User not found');
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
      throw new Error(error.message);
    }
  }

  public deleteUserAsync = async (id: number): Promise<boolean> => {
    try {
      const user: User = await this.findUserByIdAsync(id);
      if (!user) {
        throw new Error('User not found');
      }

      await this.usersRepository.delete(id);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public assignRoleAsync = async (id: number, roleId: number): Promise<boolean> => {
    try {
      // fetch the user and role
      const user: User = await this.usersRepository.findOne({
        where: { id, isActive: true },
        relations: {
          roles: true,
        }
      });
      if (!user) throw new Error(`User with ${id} was not found!`);

      const role: Role = await this.rolesRepository.findOne({
        where: { id: roleId }
      });
      if (!role) throw new Error(`Role with ${roleId} was not found!`);

      // check if assignment exists
      const alreadyExists: boolean = user.roles.some((searchedRole: Role) => searchedRole.id === role.id);
      if (alreadyExists) return true;

      user.roles.push(role);
      await this.usersRepository.save(user);
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public assignPermissionAsync = async (id: number, permissionId: number): Promise<boolean> => {
    try {
      // fetch the user and permission
      const user: User = await this.usersRepository.findOne({
        where: { id, isActive: true },
        relations: {
          permissions: true,
        }
      });
      if (!user) throw new Error(`User with ${id} was not found!`);

      const permission: Permission = await this.permissionsRepository.findOne({
        where: { id: permissionId },
      });
      if (!permission) throw new Error(`Permission with id: ${permissionId} not found!`);

      const relationshipExists: boolean = user.permissions.some((searchedPermission: Permission) => searchedPermission.id === permission.id);
      if (relationshipExists) return true;

      user.permissions.push(permission);
      await this.usersRepository.save(user);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }
}
