import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { ConnectionsModule } from './connections/connections.module';
import { CryptoModule } from './common/security/crypto/crypto.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReportTypesModule } from './report-types/report-types.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>('DB_TYPE') as 'mssql',
        host: config.get<string>('DB_HOST'),
        port: Number.parseInt(config.get<string>('DB_PORT'), 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        synchronize: config.get<string>('DB_SYNC') === 'true',
        autoLoadEntities: true,
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }),
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '3600s' },
    }),
    CryptoModule,
    AuthModule,
    UsersModule,
    ConnectionsModule,
    ReportTypesModule,
    ReportsModule,
    TasksModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
