import { Injectable, Logger } from '@nestjs/common';
import { Frequency } from 'src/report-types/entity/frequency.enum';

@Injectable()
export class CronUtil {
  private readonly logger: Logger = new Logger(CronUtil.name);

  public dateToCron = (dateTime: Date, frequency: Frequency): string => {
    try {
      const seconds: number = dateTime.getSeconds();
      const minutes: number = dateTime.getMinutes();
      const hours: number = dateTime.getHours();
      const day: number = dateTime.getDate();
      const month: number = dateTime.getMonth() + 1;
      const dayOfWeek: string = '*';

      let cronString = '';

      switch (frequency) {
        case Frequency.ON_REQUEST:
        case Frequency.ANNUALLY:
          cronString = `${seconds} ${minutes} ${hours} ${day} ${month} *`;
          break;
        case Frequency.DAILY:
          cronString = `${seconds} ${minutes} ${hours} * * *`;
          break;
        case Frequency.WEEKLY:
          cronString = `${seconds} ${minutes} ${hours} * * ${dayOfWeek}`;
          break;
        case Frequency.MONTHLY:
          cronString = `${seconds} ${minutes} ${hours} ${day} * *`;
          break;
        case Frequency.BI_ANNUALLY: {
          const nextMonth = month + 6 > 12 ? month + 6 - 12 : month + 6;
          cronString = `${seconds} ${minutes} ${hours} ${day} ${month},${nextMonth} *`;
          break;
        }
        default:
          throw new Error(`Unexpected Frequency: ${frequency}`);
      }

      this.logger.log(`Created cron string ${cronString}`);
      return cronString;
    } catch (error) {
      this.logger.error(error.message, error);
      throw new Error(error.message);
    }
  }
}
