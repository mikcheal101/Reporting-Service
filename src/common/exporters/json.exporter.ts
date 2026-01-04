import { IReportExporter } from './ireport-exporter';
import { ReportExporter } from './report-exporter';

export class JsonExporter extends ReportExporter implements IReportExporter {
  public async export(data: any[]): Promise<Buffer> {
    if (!data || data.length === 0) {
      return Buffer.from('');
    }

    const jsonResponse: string = JSON.stringify(data, null, 2);
    return Buffer.from(jsonResponse, 'utf-8');
  }
}
