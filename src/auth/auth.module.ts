import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { DataSource } from 'typeorm';
import { UserUtils } from 'src/common/utils/user.utils';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserUtils],
  imports: [UsersModule],
})
export class AuthModule {
  constructor(private readonly dataSource: DataSource) {}
}
