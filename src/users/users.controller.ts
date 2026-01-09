import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { PermissionDto } from './dto/permission.dto';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import AssignRoleDto from './dto/assign-role.dto';
import AssignPermissionDto from './dto/assign-permission.dto';

@Controller('/api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async users(): Promise<UserResponseDto[]> {
    try {
      return await this.usersService.findAsync();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async user(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      return await this.usersService.findOneByIdAsync(Number.parseInt(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
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
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  public async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
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
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  public async deleteUser(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.usersService.deleteUserAsync(Number.parseInt(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // assignments
  @HttpCode(HttpStatus.OK)
  @Post('assign-role')
  public async assignRole(@Body() assignRoleDto: AssignRoleDto): Promise<boolean> {
    try {
      return await this.usersService.assignRoleAsync(assignRoleDto.userId, assignRoleDto.roleId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('assign-permission')
  public async assignPermission(@Body() assignPermissionDto: AssignPermissionDto): Promise<boolean> {
    try {
      return await this.usersService.assignPermissionAsync(assignPermissionDto.userId, assignPermissionDto.permissionId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

}
