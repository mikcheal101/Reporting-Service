import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import PermissionDto from 'src/users/dto/permission.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { RequirePermission } from '../auth/decorator/require-permission.decorator';
import { ROUTES } from '../common/constants/routes.constant';

@UseGuards(AuthGuard, PermissionGuard)
@Controller(ROUTES.PERMISSIONS)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @RequirePermission('role.view')
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
