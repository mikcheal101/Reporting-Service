import { PdfExporter } from './pdf.exporter';
import { PassThrough } from 'node:stream';

let mockDoc: any;

jest.mock('pdfkit', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    mockDoc = {
      pipe: jest.fn((stream: PassThrough) => {
        stream.push(Buffer.from('pdf-content'));
        stream.push(null);
      }),
      text: jest.fn(),
      end: jest.fn(),
      moveDown: jest.fn(),
      y: 0,
    };
    return mockDoc;
  }),
}));

describe('PdfExporter', () => {
  let exporter: PdfExporter;

  beforeEach(() => {
    mockDoc = null;
    exporter = new PdfExporter();
  });

  it('should export data as PDF buffer', async () => {
    const data = [{ name: 'John', age: 30 }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('pdf-content');
  });

  it('should handle empty data', async () => {
    const result = await exporter.export([]);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockDoc.text).toHaveBeenCalledWith('No data available!');
  });

  it('should handle null data', async () => {
    const result = await exporter.export(null);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockDoc.text).toHaveBeenCalledWith('No data available!');
  });

  it('should handle undefined data', async () => {
    const result = await exporter.export(undefined);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockDoc.text).toHaveBeenCalledWith('No data available!');
  });

  it('should call document.end after processing', async () => {
    await exporter.export([{ a: 1 }]);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  it('should handle nested objects', async () => {
    const data = [{ user: { name: 'John' }, score: 100 }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
  });
});
