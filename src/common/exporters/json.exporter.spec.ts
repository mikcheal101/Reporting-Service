import { JsonExporter } from './json.exporter';

describe('JsonExporter', () => {
  let exporter: JsonExporter;

  beforeEach(() => {
    exporter = new JsonExporter();
  });

  it('should export data as JSON buffer', async () => {
    const data = [{ id: 1, name: 'test' }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString('utf-8')).toBe(JSON.stringify(data, null, 2));
  });

  it('should handle empty data', async () => {
    const result = await exporter.export([]);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });

  it('should handle null data', async () => {
    const result = await exporter.export(null);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });

  it('should handle undefined data', async () => {
    const result = await exporter.export(undefined);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(0);
  });

  it('should export single object array', async () => {
    const data = [{ key: 'value' }];
    const result = await exporter.export(data);
    const parsed = JSON.parse(result.toString('utf-8'));

    expect(parsed).toEqual(data);
  });
});
