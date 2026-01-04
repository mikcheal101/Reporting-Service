import { IReportExporter } from './ireport-exporter';
import { ReportExporter } from './report-exporter';

export class TxtExporter extends ReportExporter implements IReportExporter {
  public async export(data: any[]): Promise<Buffer> {
    if (!data || data.length === 0) {
      return Buffer.from('No available data!');
    }

    const flattened: any[] = data.map((datum) => this.flattenObject(datum));

    const headers: any[] = Array.from(
      new Set(flattened.flatMap((row) => Object.keys(row))),
    );

    const headerLine = headers.join('\t');

    const rows = flattened.map((row) =>
      headers
        .map((header) =>
          row[header] !== undefined && row[header] !== null
            ? String(row[header])
            : '',
        )
        .join('\t'),
    );

    const output = [headerLine, ...rows].join('\n') + '\n';

    return Buffer.from(output, 'utf-8');
  }
}
