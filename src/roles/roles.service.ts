import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleUtils } from 'src/common/utils/role.utils';
import PermissionRequestDto from 'src/users/dto/permission.request.dto';
import { RoleDto } from 'src/users/dto/role.dto';
import { Role } from 'src/users/entity/roles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly roleUtils: RoleUtils
  ) {
    this.logger = new Logger(RolesService.name);
  }

  public createAsync = async (name: string, permissions: PermissionRequestDto[]): Promise<RoleDto> => {
    try {
      // lowercase the name
      name = name.toLowerCase();

      // Check if the role exists
      const existingRole: RoleDto = await this.findByNameAsync(name);
      if (existingRole) {
        throw new Error('Role already exists');
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
      throw new Error(error.message);
    }
  };

  public updateAsync = async (id: number, name: string, permissions: PermissionRequestDto[]): Promise<RoleDto> => {
    try {
      name = name.toLowerCase();

      // Check if the role exists
      const existingRole: RoleDto = await this.findOneAsync(id);
      if (!existingRole) {
        throw new Error('Role not found');
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
      throw new Error(error.message);
    }
  }

  public findOneAsync = async (id: number): Promise<RoleDto | null> => {
    try {
      const role: Role = await this.rolesRepository.findOne({
        where: { id },
        relations: {
          permissions: true,
        }
      });
      return this.roleUtils.mapRoleToDto(role);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public findByNameAsync = async (name: string): Promise<RoleDto | null> => {
    try {
      const role: Role = await this.rolesRepository.findOne({
        where: { name },
        relations: {
          permissions: true,
        }
      });

      if (!role) return null;

      return this.roleUtils.mapRoleToDto(role);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public findAllAsync = async (): Promise<RoleDto[]> => {
    try {
      const roles: Role[] = await this.rolesRepository.find({
        relations: {
          permissions: true,
        }
      });
      return roles.map(this.roleUtils.mapRoleToDto);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public deleteAsync = async (id: number): Promise<boolean> => {
    try {
      const existingRole: RoleDto = await this.findOneAsync(id);
      if (!existingRole) {
        throw new Error('Role not found');
      }

      // deny updating the super admin
      this.denySuperAdminUpdate(existingRole.name);

      await this.rolesRepository.delete(id);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  private denySuperAdminUpdate = (existingRoleName: string) => {
    // confirm its not super-admin
    if (existingRoleName.toLowerCase() === "super-admin") throw new Error('Role cannot be modified!');
  }
}
