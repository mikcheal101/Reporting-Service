import { ConnectionDto } from 'src/connections/dto/connection.dto';
import { ReportTypeDto } from 'src/report-types/dto/report-type.dto';
import { ReportDetailDto } from './report-detail.dto';

export class ReportDto {
  id: number;
  name: string;
  description: string;
  connectionId: number;
  connection: ConnectionDto;
  reportTypeId: number;
  reportType: ReportTypeDto;
  reportDetails: ReportDetailDto[];
  queryString?: string;
}