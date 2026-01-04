import { CsvExporter } from './csv.exporter';
import { ExcelExporter } from './excel.exporter';
import { IReportExporter } from './ireport-exporter';
import { JsonExporter } from './json.exporter';
import { OutputFormat } from './output-format.enum';
import { PdfExporter } from './pdf.exporter';
import { TxtExporter } from './txt.exporter';
import { WordExporter } from './word.exporter';

export class ExporterFactory {
  public static create(outputFormat: OutputFormat): IReportExporter {
    switch (outputFormat) {
      case OutputFormat.CSV:
        return new CsvExporter();
      case OutputFormat.EXCEL:
        return new ExcelExporter();
      case OutputFormat.JSON:
        return new JsonExporter();
      case OutputFormat.PDF:
        return new PdfExporter();
      case OutputFormat.TXT:
        return new TxtExporter();
      case OutputFormat.WORD:
        return new WordExporter();
      default:
        throw new Error('Output format not recognized!');
    }
  }
}
