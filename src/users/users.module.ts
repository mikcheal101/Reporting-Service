import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/users.entity';
import { UsersController } from './users.controller';
import { UserUtils } from 'src/common/utils/user.utils';
import { Role } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { RoleUtils } from 'src/common/utils/role.utils';
import { PermissionUtils } from 'src/common/utils/permission.utils';

@Module({
  providers: [UsersService, UserUtils, RoleUtils, PermissionUtils ],
  exports: [UsersService, TypeOrmModule],
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UsersController],
})
export class UsersModule {}
