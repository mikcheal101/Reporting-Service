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
} from '@nestjs/common';
import CreateRoleDto from 'src/users/dto/create-role.dto';
import { RoleDto } from 'src/users/dto/role.dto';
import UpdateRoleDto from 'src/users/dto/update-role.dto';
import { RolesService } from './roles.service';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@Controller(ROUTES.ROLES)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Roles part
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
