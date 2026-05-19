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
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import AssignRoleDto from './dto/assign-role.dto';
import AssignPermissionDto from './dto/assign-permission.dto';
import ChangePasswordDto from './dto/change-password.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RequirePermission } from '../auth/decorator/require-permission.decorator';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@UseGuards(AuthGuard)
@Controller(ROUTES.USERS)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermission('user.list')
  @HttpCode(HttpStatus.OK)
  @Get()
  public async users(): Promise<UserResponseDto[]> {
    try {
      return await this.usersService.findAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('user.view')
  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.ID)
  public async user(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      return await this.usersService.findOneByIdAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('user.create')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.usersService.createUserAsync(
        createUserDto.username,
        createUserDto.password,
        createUserDto.firstName,
        createUserDto.lastName,
        createUserDto.phone,
        createUserDto.middleName,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('user.update')
  @HttpCode(HttpStatus.OK)
  @Put(ROUTE_PATHS.ID)
  public async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.usersService.updateUserAsync(
        Number.parseInt(id),
        updateUserDto.username,
        updateUserDto.firstName,
        updateUserDto.lastName,
        updateUserDto.phone,
        updateUserDto.middleName,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('user.delete')
  @HttpCode(HttpStatus.OK)
  @Delete(ROUTE_PATHS.ID)
  public async deleteUser(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.usersService.deleteUserAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('user.update')
  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.CHANGE_PASSWORD)
  public async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<boolean> {
    try {
      return await this.usersService.changePasswordAsync(
        Number.parseInt(id),
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  // assignments
  @RequirePermission('user.update')
  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.ASSIGN_ROLE)
  public async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
  ): Promise<boolean> {
    try {
      return await this.usersService.assignRoleAsync(
        assignRoleDto.userId,
        assignRoleDto.roleIds,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @RequirePermission('user.update')
  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.ASSIGN_PERMISSION)
  public async assignPermission(
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<boolean> {
    try {
      return await this.usersService.assignPermissionAsync(
        assignPermissionDto.userId,
        assignPermissionDto.permissionId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
