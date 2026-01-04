import { Frequency } from '../entity/frequency.enum';
import { OutputFormat } from '../../common/exporters/output-format.enum';

export class ReportTypeDto {
  id: number;
  name: string;
  outputType: OutputFormat;
  frequency: Frequency;
  runDate: string;
  runTime: string;
  emailsToNotify: string;
}
