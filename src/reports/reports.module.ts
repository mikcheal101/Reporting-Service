import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entity/report.entity';
import { ReportDetail } from './entity/report-detail.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportDetailUtil } from './utils/report-details.utils';
import { ReportUtils } from './utils/report.utils';
import { ConnectionUtils } from 'src/connections/utils/connection.utils';
import { ReportTypeUtils } from 'src/report-types/utils/report-type.utils';
import { DatabaseUtils } from 'src/common/utils/database.utils';
import { QueryParameter } from './entity/query-parameter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportDetail, QueryParameter])],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportDetailUtil,
    ReportUtils,
    ConnectionUtils,
    ReportTypeUtils,
    DatabaseUtils,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
