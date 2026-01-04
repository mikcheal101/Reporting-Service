import { PassThrough } from 'node:stream';
import { IReportExporter } from './ireport-exporter';
import { ReportExporter } from './report-exporter';
import PDFDocument from 'pdfkit';

export class PdfExporter extends ReportExporter implements IReportExporter {
  public async export(data: any[]): Promise<Buffer> {
    const document = new PDFDocument({ autoFirstPage: true });
    const stream = new PassThrough();
    document.pipe(stream);

    if (!data || data.length === 0) {
      document.text('No data available!');
      document.end();
    } else {
      const flattened = this.flattenObjectArray(data);
      const headers = this.getUniqueColumns(flattened);

      const columnWidth = 540 / headers.length;

      // print header
      headers.forEach((header, index) => {
        document.text(header, 30 + index * columnWidth, document.y, {
          width: columnWidth,
          continued: index !== headers.length - 1,
        });
      });
      document.moveDown();

      // print rows
      flattened.forEach((row) => {
        headers.forEach((header, index) => {
          const value = row[header] ? String(row[header]) : '';
          document.text(value, 30 + index * columnWidth, document.y, {
            width: columnWidth,
            continued: index !== headers.length - 1,
          });
        });
        document.moveDown();
      });
      document.end();
    }

    const buffers: any[] = [];
    for await (const chunk of stream) {
      buffers.push(chunk);
    }
    return Buffer.concat(buffers);
  }
}
