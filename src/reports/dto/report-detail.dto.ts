import { ReportDto } from './report.dto';

export class ReportDetailDto {
  id: number;
  tableName?: string;
  fieldName?: string;
  dataType?: string;
  report?: ReportDto;
}
