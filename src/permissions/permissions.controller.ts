import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import PermissionDto from 'src/users/dto/permission.dto';
import { ROUTES } from '../common/constants/routes.constant';

@Controller(ROUTES.PERMISSIONS)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @HttpCode(HttpStatus.OK)
  @Get('')
  public async permissions(): Promise<PermissionDto[]> {
    try {
      return await this.permissionsService.findAllAsync();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
