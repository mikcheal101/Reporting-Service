import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { DataSource } from 'typeorm';
import { UserUtils } from 'src/common/utils/user.utils';
import { RoleUtils } from 'src/common/utils/role.utils';
import { PermissionUtils } from 'src/common/utils/permission.utils';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserUtils, RoleUtils, PermissionUtils],
  imports: [UsersModule],
})
export class AuthModule {
  constructor(private readonly dataSource: DataSource) {}
}
