import { ConnectionUtils } from 'src/connections/utils/connection.utils';
import { ReportDto } from '../dto/report.dto';
import { Report } from '../entity/report.entity';
import { ReportTypeUtils } from 'src/report-types/utils/report-type.utils';
import { ReportDetailUtil } from './report-details.utils';
import { ReportDetailDto } from '../dto/report-detail.dto';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReportUtils {
  private readonly logger: Logger;

  constructor(
    private readonly connectionUtils: ConnectionUtils,
    private readonly reportTypeUtils: ReportTypeUtils,
    private readonly reportDetailUtil: ReportDetailUtil,
  ) {
    this.logger = new Logger(ReportUtils.name);
  }

  public convertToDto(report: Report): ReportDto {
    if (!report) return undefined;
    try {
      const reportDetails: ReportDetailDto[] = [];
      report.reportDetails?.forEach((reportDetail) => {
        reportDetails.push(this.reportDetailUtil.convertToDto(reportDetail));
      });

      return {
        id: report.id,
        name: report.name,
        description: report.description,
        queryString: report.queryString,
        connectionId: report.connection?.id,
        connection: this.connectionUtils.convertToDto(report.connection),
        reportTypeId: report.reportType?.id,
        reportType: this.reportTypeUtils.convertToDto(report.reportType),
        reportDetails,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return undefined;
    }
  }
}
