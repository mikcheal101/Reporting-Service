import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RoleUtils } from 'src/common/utils/role.utils';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/users/entity/roles.entity';
import { PermissionUtils } from 'src/common/utils/permission.utils';

@Module({
  providers: [RolesService, RoleUtils, PermissionUtils],
  exports: [RolesService, TypeOrmModule],
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RolesController]
})
export class RolesModule {}
