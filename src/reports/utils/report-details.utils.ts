import { Injectable, Logger } from '@nestjs/common';
import { ReportDetailDto } from '../dto/report-detail.dto';
import { ReportDetail } from '../entity/report-detail.entity';

@Injectable()
export class ReportDetailUtil {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(ReportDetailUtil.name);
  }

  public convertToDto(reportDetail: ReportDetail): ReportDetailDto {
    if (reportDetail === undefined) return undefined;
    try {
      return {
        id: reportDetail.id,
        tableName: reportDetail.tableName,
        fieldName: reportDetail.fieldName,
        dataType: reportDetail.dataType,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return undefined;
    }
  }
}
