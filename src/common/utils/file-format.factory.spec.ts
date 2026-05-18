import { FileFormatFactory } from './file-format.factory';
import { OutputFormat } from '../exporters/output-format.enum';

describe('FileFormatFactory', () => {
  it('should return .csv for CSV', () => {
    expect(FileFormatFactory.create(OutputFormat.CSV)).toBe('.csv');
  });

  it('should return .xlsx for EXCEL', () => {
    expect(FileFormatFactory.create(OutputFormat.EXCEL)).toBe('.xlsx');
  });

  it('should return .json for JSON', () => {
    expect(FileFormatFactory.create(OutputFormat.JSON)).toBe('.json');
  });

  it('should return .pdf for PDF', () => {
    expect(FileFormatFactory.create(OutputFormat.PDF)).toBe('.pdf');
  });

  it('should return .txt for TXT', () => {
    expect(FileFormatFactory.create(OutputFormat.TXT)).toBe('.txt');
  });

  it('should return .doc for WORD', () => {
    expect(FileFormatFactory.create(OutputFormat.WORD)).toBe('.doc');
  });

  it('should throw for unsupported format', () => {
    expect(() => FileFormatFactory.create(999 as OutputFormat)).toThrow(
      'Unsupported file format!',
    );
  });
});
