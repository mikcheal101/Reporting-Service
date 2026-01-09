import { IReportExporter } from './ireport-exporter';
import { ReportExporter } from './report-exporter';
import { Workbook } from 'exceljs';

export class ExcelExporter extends ReportExporter implements IReportExporter {
  public async export(data: any[]): Promise<Buffer> {
    const workbook: Workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Generated Report');

    if (!data || data.length === 0) {
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }

    const flattened = data.map((datum) => this.flattenObject(datum));

    // get unique columns
    const columns = Array.from(
      new Set(flattened.flatMap((row) => Object.keys(row))),
    );

    // add headers
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
    }));

    // add rows
    flattened.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
