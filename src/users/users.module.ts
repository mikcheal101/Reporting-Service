import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/users.entity';
import { Role } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';

@Module({
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
})
export class UsersModule {}
