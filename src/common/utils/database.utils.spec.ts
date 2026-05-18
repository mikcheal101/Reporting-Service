import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseUtils } from './database.utils';
import { DatabaseDatatype } from '../models/database.datatypes.enum';

describe('DatabaseUtils', () => {
  let databaseUtils: DatabaseUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseUtils],
    }).compile();

    databaseUtils = module.get<DatabaseUtils>(DatabaseUtils);
  });

  it('should map a string parameter', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@name', value: 'John', dataType: 'STRING' },
    ]);

    expect(result).toEqual({
      name: { type: DatabaseDatatype.STRING, value: 'John' },
    });
  });

  it('should default unknown dataType to STRING', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@unknown', value: 'something', dataType: 'UNKNOWN' },
    ]);

    expect(result).toEqual({
      unknown: { type: DatabaseDatatype.STRING, value: 'something' },
    });
  });

  it('should map a number parameter', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@age', value: '25', dataType: 'NUMBER' },
    ]);

    expect(result).toEqual({
      age: { type: DatabaseDatatype.NUMBER, value: 25 },
    });
  });

  it('should map a boolean parameter with true value', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@isActive', value: 'true', dataType: 'BOOLEAN' },
    ]);

    expect(result).toEqual({
      isActive: { type: DatabaseDatatype.BOOLEAN, value: true },
    });
  });

  it('should map a boolean parameter with false value', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@isActive', value: 'false', dataType: 'BOOLEAN' },
    ]);

    expect(result).toEqual({
      isActive: { type: DatabaseDatatype.BOOLEAN, value: false },
    });
  });

  it('should map a date parameter', () => {
    const dateStr = '2025-06-15T10:30:00Z';
    const result = databaseUtils.mapDbParameters([
      { name: '@startDate', value: dateStr, dataType: 'DATE' },
    ]);

    expect(result).toEqual({
      startDate: { type: DatabaseDatatype.DATE, value: new Date(dateStr) },
    });
  });

  it('should strip @ prefix from parameter name', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@@weird', value: 'test', dataType: 'STRING' },
    ]);

    expect(result).toEqual({
      '@weird': { type: DatabaseDatatype.STRING, value: 'test' },
    });
  });

  it('should handle multiple parameters', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@name', value: 'John', dataType: 'STRING' },
      { name: '@age', value: '30', dataType: 'NUMBER' },
      { name: '@isActive', value: 'true', dataType: 'BOOLEAN' },
      { name: '@dob', value: '2025-01-01', dataType: 'DATE' },
    ]);

    expect(result).toEqual({
      name: { type: DatabaseDatatype.STRING, value: 'John' },
      age: { type: DatabaseDatatype.NUMBER, value: 30 },
      isActive: { type: DatabaseDatatype.BOOLEAN, value: true },
      dob: { type: DatabaseDatatype.DATE, value: new Date('2025-01-01') },
    });
  });

  it('should handle empty parameter array', () => {
    const result = databaseUtils.mapDbParameters([]);
    expect(result).toEqual({});
  });

  it('should convert number string to NaN gracefully', () => {
    const result = databaseUtils.mapDbParameters([
      { name: '@val', value: 'not-a-number', dataType: 'NUMBER' },
    ]);

    expect(result.val.type).toBe(DatabaseDatatype.NUMBER);
    expect(Number.isNaN(result.val.value)).toBe(true);
  });
});
