import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionUtils } from 'src/common/utils/permission.utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { Permission } from 'src/users/entity/permissions.entity';

@Module({
  providers: [PermissionsService, PermissionUtils],
  exports: [PermissionsService, TypeOrmModule],
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController]
})
export class PermissionsModule {}
