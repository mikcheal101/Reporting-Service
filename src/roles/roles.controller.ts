import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import CreateRoleDto from 'src/users/dto/create-role.dto';
import { RoleDto } from 'src/users/dto/role.dto';
import UpdateRoleDto from 'src/users/dto/update-role.dto';
import { RolesService } from './roles.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { RequirePermission } from '../auth/decorator/require-permission.decorator';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@UseGuards(AuthGuard, PermissionGuard)
@Controller(ROUTES.ROLES)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Roles part
  @RequirePermission('role.list')
  @HttpCode(HttpStatus.OK)
  @Get()
  public async roles(): Promise<RoleDto[]> {
    try {
      return await this.rolesService.findAllAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('role.view')
  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.ID)
  public async role(@Param('id') id: string): Promise<RoleDto> {
    try {
      return await this.rolesService.findOneAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('role.create')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<RoleDto> {
    try {
      return await this.rolesService.createAsync(
        createRoleDto.name,
        createRoleDto.permissions,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('role.update')
  @HttpCode(HttpStatus.OK)
  @Put(ROUTE_PATHS.ID)
  public async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDto> {
    try {
      return await this.rolesService.updateAsync(
        Number.parseInt(id),
        updateRoleDto.name,
        updateRoleDto.permissions,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('role.delete')
  @HttpCode(HttpStatus.OK)
  @Delete(ROUTE_PATHS.ID)
  public async deleteRole(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.rolesService.deleteAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
