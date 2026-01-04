import {
  Paragraph,
  TableCell,
  TableRow,
  Table,
  WidthType,
  Document,
  Packer,
} from 'docx';
import { IReportExporter } from './ireport-exporter';
import { ReportExporter } from './report-exporter';

export class WordExporter extends ReportExporter implements IReportExporter {
  public async export(data: any[]): Promise<Buffer> {
    let children: any[] = [];

    if (!data || data.length === 0) {
      children = [new Paragraph('No Available Data!')];
    } else {
      const flattened = data.map((datum) => this.flattenObject(datum));
      const headers = Array.from(
        new Set(flattened.flatMap((item) => Object.keys(item))),
      );

      const headerRow = new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({ children: [new Paragraph({ text: header })] }),
        ),
      });

      const rows = flattened.map(
        (row) =>
          new TableRow({
            children: headers.map(
              (header) =>
                new TableCell({
                  children: [new Paragraph(String(row[header] ?? ''))],
                }),
            ),
          }),
      );

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...rows],
      });

      children = [table];
    }

    const document: Document = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBuffer(document);
  }
}
