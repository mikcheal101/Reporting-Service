import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportType } from './entity/report-types.entity';
import { ReportTypesService } from './report-types.service';
import { ReportTypesController } from './report-types.controller';
import { ReportTypeUtils } from './utils/report-type.utils';
import { CronUtil } from 'src/common/utils/cron.utils';

@Module({
  imports: [TypeOrmModule.forFeature([ReportType])],
  providers: [ReportTypesService, ReportTypeUtils, CronUtil],
  controllers: [ReportTypesController],
  exports: [ReportTypesService],
})
export class ReportTypesModule {}
