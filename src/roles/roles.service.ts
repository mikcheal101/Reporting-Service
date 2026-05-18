import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleUtils } from 'src/common/utils/role.utils';
import PermissionRequestDto from 'src/users/dto/permission.request.dto';
import { RoleDto } from 'src/users/dto/role.dto';
import { Role } from 'src/users/entity/roles.entity';
import { Repository } from 'typeorm';
import { ERRORS } from '../common/constants/error-messages.constant';

@Injectable()
export class RolesService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly roleUtils: RoleUtils,
  ) {
    this.logger = new Logger(RolesService.name);
  }

  public createAsync = async (
    name: string,
    permissions: PermissionRequestDto[],
  ): Promise<RoleDto> => {
    try {
      // lowercase the name
      name = name.toLowerCase();

      // Check if the role exists
      const existingRole: RoleDto = await this.findByNameAsync(name);
      if (existingRole) {
        throw new ConflictException(ERRORS.ROLE_ALREADY_EXISTS);
      }

      // Create the role
      const newRole: Role = await this.rolesRepository.save({
        name,
        permissions: permissions.map((permission) => ({
          id: permission.id,
        })),
      });

      const savedRole: RoleDto = await this.findOneAsync(newRole.id);

      return savedRole;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public updateAsync = async (
    id: number,
    name: string,
    permissions: PermissionRequestDto[],
  ): Promise<RoleDto> => {
    try {
      name = name.toLowerCase();

      // Check if the role exists
      const existingRole: RoleDto = await this.findOneAsync(id);
      if (!existingRole) {
        throw new NotFoundException(ERRORS.ROLE_NOT_FOUND);
      }

      // deny updating the super admin
      this.denySuperAdminUpdate(existingRole.name);

      // Update the role
      const role: Role = await this.rolesRepository.save({
        id,
        name,
        permissions: permissions.map((permission) => ({
          id: permission.id,
        })),
      });

      const updatedRole: RoleDto = await this.findOneAsync(role.id);
      return updatedRole;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public findOneAsync = async (id: number): Promise<RoleDto | null> => {
    try {
      const role: Role = await this.rolesRepository.findOne({
        where: { id },
        relations: {
          permissions: true,
        },
      });
      return this.roleUtils.mapRoleToDto(role);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public findByNameAsync = async (name: string): Promise<RoleDto | null> => {
    try {
      const role: Role = await this.rolesRepository.findOne({
        where: { name },
        relations: {
          permissions: true,
        },
      });

      if (!role) return null;

      return this.roleUtils.mapRoleToDto(role);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public findAllAsync = async (): Promise<RoleDto[]> => {
    try {
      const roles: Role[] = await this.rolesRepository.find({
        relations: {
          permissions: true,
        },
      });
      return roles.map(this.roleUtils.mapRoleToDto);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public deleteAsync = async (id: number): Promise<boolean> => {
    try {
      const existingRole: RoleDto = await this.findOneAsync(id);
      if (!existingRole) {
        throw new NotFoundException(ERRORS.ROLE_NOT_FOUND);
      }

      // deny updating the super admin
      this.denySuperAdminUpdate(existingRole.name);

      await this.rolesRepository.delete(id);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  private denySuperAdminUpdate = (existingRoleName: string) => {
    // confirm its not super-admin
    if (existingRoleName.toLowerCase() === 'super-admin')
      throw new ForbiddenException(ERRORS.SUPER_ADMIN_CANNOT_BE_MODIFIED);
  };
}
