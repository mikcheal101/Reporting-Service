import { CsvExporter } from './csv.exporter';

jest.mock('json2csv', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue('col1,col2\nval1,val2\n'),
  })),
}));

describe('CsvExporter', () => {
  let exporter: CsvExporter;

  beforeEach(() => {
    exporter = new CsvExporter();
  });

  it('should export data as CSV buffer', async () => {
    const data = [{ col1: 'val1', col2: 'val2' }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('\uFEFF' + 'col1,col2\nval1,val2\n');
  });

  it('should flatten nested objects', async () => {
    const data = [{ name: 'test', nested: { field: 'value' } }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return empty buffer for empty data', async () => {
    const result = await exporter.export([]);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });

  it('should return empty buffer for null data', async () => {
    const result = await exporter.export(null);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });

  it('should return empty buffer for undefined data', async () => {
    const result = await exporter.export(undefined);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });

  it('should handle array of empty objects', async () => {
    const result = await exporter.export([{}]);
    expect(result).toBeInstanceOf(Buffer);
  });
});
