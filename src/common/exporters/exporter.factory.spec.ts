import { ExporterFactory } from './exporter.factory';
import { OutputFormat } from './output-format.enum';
import { CsvExporter } from './csv.exporter';
import { ExcelExporter } from './excel.exporter';
import { JsonExporter } from './json.exporter';
import { PdfExporter } from './pdf.exporter';
import { TxtExporter } from './txt.exporter';
import { WordExporter } from './word.exporter';

describe('ExporterFactory', () => {
  it('should create CsvExporter for CSV', () => {
    const exporter = ExporterFactory.create(OutputFormat.CSV);
    expect(exporter).toBeInstanceOf(CsvExporter);
  });

  it('should create ExcelExporter for EXCEL', () => {
    const exporter = ExporterFactory.create(OutputFormat.EXCEL);
    expect(exporter).toBeInstanceOf(ExcelExporter);
  });

  it('should create JsonExporter for JSON', () => {
    const exporter = ExporterFactory.create(OutputFormat.JSON);
    expect(exporter).toBeInstanceOf(JsonExporter);
  });

  it('should create PdfExporter for PDF', () => {
    const exporter = ExporterFactory.create(OutputFormat.PDF);
    expect(exporter).toBeInstanceOf(PdfExporter);
  });

  it('should create TxtExporter for TXT', () => {
    const exporter = ExporterFactory.create(OutputFormat.TXT);
    expect(exporter).toBeInstanceOf(TxtExporter);
  });

  it('should create WordExporter for WORD', () => {
    const exporter = ExporterFactory.create(OutputFormat.WORD);
    expect(exporter).toBeInstanceOf(WordExporter);
  });

  it('should throw for unrecognized format', () => {
    expect(() => ExporterFactory.create(999 as OutputFormat)).toThrow(
      'Output format not recognized!',
    );
  });
});
