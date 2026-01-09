import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionUtils } from 'src/common/utils/permission.utils';
import { PermissionDto } from 'src/users/dto/permission.dto';
import { Permission } from 'src/users/entity/permissions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly permissionUtils: PermissionUtils
  ) {
    this.logger = new Logger(PermissionsService.name);
  }

  public findAllAsync = async (): Promise<PermissionDto[]> => {
    try {
      const permissions: Permission[] = await this.permissionsRepository.find();
      return permissions.map(this.permissionUtils.mapPermissionToDto);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }
}
