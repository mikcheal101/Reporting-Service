import { IReportExporter } from './ireport-exporter';
import { Parser } from 'json2csv';
import { ReportExporter } from './report-exporter';

export class CsvExporter extends ReportExporter implements IReportExporter {
  public async export(data: any[]): Promise<Buffer> {
    if (!data || data.length === 0) {
      return Buffer.from('');
    }

    // Flatten the DB response
    const flattened = data.map((datum) => this.flattenObject(datum));

    const fields = Array.from(
      new Set(flattened.flatMap((row) => Object.keys(row))),
    );

    const parser: Parser = new Parser({ fields });
    const csv = parser.parse(flattened);

    return Buffer.from('\uFEFF' + csv);
  }
}
