import { TxtExporter } from './txt.exporter';

describe('TxtExporter', () => {
  let exporter: TxtExporter;

  beforeEach(() => {
    exporter = new TxtExporter();
  });

  it('should export data as tab-separated text buffer', async () => {
    const data = [
      { name: 'John', age: '30' },
      { name: 'Jane', age: '25' },
    ];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    const text = result.toString('utf-8');
    expect(text).toContain('name\tage');
    expect(text).toContain('John\t30');
    expect(text).toContain('Jane\t25');
  });

  it('should flatten nested objects', async () => {
    const data = [{ user: { name: 'John' }, score: 100 }];
    const result = await exporter.export(data);

    const text = result.toString('utf-8');
    expect(text).toContain('user.name');
    expect(text).toContain('John');
  });

  it('should handle empty data', async () => {
    const result = await exporter.export([]);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString('utf-8')).toBe('No available data!');
  });

  it('should handle null data', async () => {
    const result = await exporter.export(null);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString('utf-8')).toBe('No available data!');
  });

  it('should handle undefined data', async () => {
    const result = await exporter.export(undefined);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString('utf-8')).toBe('No available data!');
  });

  it('should handle single row', async () => {
    const data = [{ col1: 'value1' }];
    const result = await exporter.export(data);

    const text = result.toString('utf-8');
    expect(text).toContain('col1');
    expect(text).toContain('value1');
  });

  it('should handle null/undefined values in row', async () => {
    const data = [{ a: 'val', b: null, c: undefined }];
    const result = await exporter.export(data);

    const text = result.toString('utf-8');
    expect(text).toContain('a\tb\tc');
    expect(text).toContain('val');
  });
});
