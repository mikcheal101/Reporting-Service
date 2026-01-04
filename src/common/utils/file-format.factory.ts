import { OutputFormat } from '../exporters/output-format.enum';

export class FileFormatFactory {
  public static create(outputFormat: OutputFormat): string {
    switch (outputFormat) {
      case OutputFormat.CSV:
        return '.csv';
      case OutputFormat.EXCEL:
        return '.xlsx';
      case OutputFormat.JSON:
        return '.json';
      case OutputFormat.PDF:
        return '.pdf';
      case OutputFormat.TXT:
        return '.txt';
      case OutputFormat.WORD:
        return '.doc';
      default:
        throw new Error('Unsupported file format!');
    }
  }
}
