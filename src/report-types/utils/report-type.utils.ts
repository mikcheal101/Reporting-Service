import { Injectable, Logger } from '@nestjs/common';
import { ReportTypeDto } from '../dto/report-type.dto';
import { ReportType } from '../entity/report-types.entity';

@Injectable()
export class ReportTypeUtils {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(ReportTypeUtils.name);
  }

  public convertToDto = (reportType: ReportType): ReportTypeDto | undefined => {
    if (reportType === undefined) return undefined;
    try {
      const datetime = new Date(reportType.datetime);
      const runDate = datetime.toLocaleDateString('en-CA').trim();
      const runTime = datetime
        .toLocaleTimeString('en-CA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
        .split(' ')[0]
        .trim();
      return {
        id: reportType.id,
        name: reportType.name,
        frequency: reportType.frequency,
        emailsToNotify: reportType.emails,
        outputType: reportType.outputType,
        runTime: runTime.split('.')[0],
        runDate,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return undefined;
    }
  }
}
