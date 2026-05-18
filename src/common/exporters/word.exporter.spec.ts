import { WordExporter } from './word.exporter';

jest.mock('docx', () => ({
  Paragraph: jest.fn().mockImplementation((opts) => opts),
  TableCell: jest.fn().mockImplementation((opts) => opts),
  TableRow: jest.fn().mockImplementation((opts) => opts),
  Table: jest.fn().mockImplementation((opts) => opts),
  WidthType: { PERCENTAGE: 'PERCENTAGE' },
  Document: jest.fn().mockImplementation((opts) => opts),
  Packer: {
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('docx-content')),
  },
}));

describe('WordExporter', () => {
  let exporter: WordExporter;

  beforeEach(() => {
    jest.clearAllMocks();
    exporter = new WordExporter();
  });

  it('should export data as Word buffer', async () => {
    const data = [{ name: 'John', age: 30 }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('docx-content');
  });

  it('should handle empty data', async () => {
    const result = await exporter.export([]);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle null data', async () => {
    const result = await exporter.export(null);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle undefined data', async () => {
    const result = await exporter.export(undefined);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should flatten nested objects', async () => {
    const data = [{ user: { name: 'John' }, age: 30 }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should create paragraph for empty data', async () => {
    await exporter.export([]);

    const { Paragraph } = jest.requireMock('docx');
    expect(Paragraph).toHaveBeenCalledWith('No Available Data!');
  });

  it('should create table for non-empty data', async () => {
    const data = [{ col1: 'val1', col2: 'val2' }];
    await exporter.export(data);

    const { Table, TableRow, TableCell, Paragraph } = jest.requireMock('docx');
    expect(Table).toHaveBeenCalled();
    expect(TableRow).toHaveBeenCalled();
    expect(TableCell).toHaveBeenCalled();
    expect(Paragraph).toHaveBeenCalled();
  });
});
