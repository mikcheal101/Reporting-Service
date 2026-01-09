import { BadRequestException, Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionDto } from 'src/users/dto/permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @HttpCode(HttpStatus.OK)
  @Get('permissions')
  public async permissions(): Promise<PermissionDto[]> {
    try {
      return await this.permissionsService.findAllAsync();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
