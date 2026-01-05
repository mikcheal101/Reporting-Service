import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entity/users.entity';

@Controller('/api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  public async users(): Promise<User[]> {
    try {
      return await this.usersService.find();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async user(@Param('id') id: string): Promise<User> {
    try {
      return await this.usersService.findOneById(Number.parseInt(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
