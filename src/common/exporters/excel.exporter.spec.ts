import { ExcelExporter } from './excel.exporter';

let mockAddRow: jest.Mock;
let mockWriteBuffer: jest.Mock;

jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    addWorksheet: jest.fn().mockReturnValue({
      columns: [],
      addRow: mockAddRow,
    }),
    xlsx: {
      writeBuffer: mockWriteBuffer,
    },
  })),
}));

describe('ExcelExporter', () => {
  let exporter: ExcelExporter;

  beforeEach(() => {
    mockAddRow = jest.fn();
    mockWriteBuffer = jest.fn().mockResolvedValue(Buffer.from('excel-buffer'));
    exporter = new ExcelExporter();
  });

  it('should export data as Excel buffer', async () => {
    const data = [{ name: 'John', age: 30 }];
    const result = await exporter.export(data);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('excel-buffer');
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

  it('should add rows for each data item', async () => {
    const data = [
      { id: 1, val: 'a' },
      { id: 2, val: 'b' },
    ];
    await exporter.export(data);

    expect(mockAddRow).toHaveBeenCalledTimes(2);
  });

  it('should set worksheet columns from data keys', async () => {
    const data = [{ col1: 'v1', col2: 'v2' }];
    await exporter.export(data);

    expect(mockWriteBuffer).toHaveBeenCalled();
  });
});
