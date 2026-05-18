import { ReportExporter } from './report-exporter';

class TestExporter extends ReportExporter {
  public testFlatten(obj: any): any {
    return this.flattenObject(obj);
  }

  public testFlattenArray(data: any[]): any[] {
    return this.flattenObjectArray(data);
  }

  public testGetUniqueColumns(flattened: any[]): any[] {
    return this.getUniqueColumns(flattened);
  }

  public testFlattenAndGetUnique(data: any[]): any[] {
    return this.flattenAndGetUniqueColumns(data);
  }
}

describe('ReportExporter', () => {
  let exporter: TestExporter;

  beforeEach(() => {
    exporter = new TestExporter();
  });

  describe('flattenObject', () => {
    it('should flatten a simple object', () => {
      const result = exporter.testFlatten({ a: 1, b: 'hello' });
      expect(result).toEqual({ a: 1, b: 'hello' });
    });

    it('should flatten nested objects', () => {
      const result = exporter.testFlatten({ a: { b: { c: 1 } }, d: 2 });
      expect(result).toEqual({ 'a.b.c': 1, d: 2 });
    });

    it('should stringify arrays', () => {
      const result = exporter.testFlatten({ a: [1, 2, 3], b: 'test' });
      expect(result).toEqual({ a: '[1,2,3]', b: 'test' });
    });

    it('should handle null values', () => {
      const result = exporter.testFlatten({ a: null, b: undefined });
      expect(result).toEqual({ a: null, b: undefined });
    });

    it('should handle empty object', () => {
      const result = exporter.testFlatten({});
      expect(result).toEqual({});
    });

    it('should handle boolean and number values', () => {
      const result = exporter.testFlatten({
        isActive: true,
        count: 0,
        name: '',
      });
      expect(result).toEqual({ isActive: true, count: 0, name: '' });
    });
  });

  describe('flattenObjectArray', () => {
    it('should flatten each object in array', () => {
      const data = [{ a: { b: 1 } }, { a: { b: 2 } }];
      const result = exporter.testFlattenArray(data);
      expect(result).toEqual([{ 'a.b': 1 }, { 'a.b': 2 }]);
    });

    it('should handle empty array', () => {
      const result = exporter.testFlattenArray([]);
      expect(result).toEqual([]);
    });
  });

  describe('getUniqueColumns', () => {
    it('should get unique column names', () => {
      const data = [
        { a: 1, b: 2 },
        { b: 3, c: 4 },
      ];
      const result = exporter.testGetUniqueColumns(data);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      const result = exporter.testGetUniqueColumns([]);
      expect(result).toEqual([]);
    });
  });

  describe('flattenAndGetUniqueColumns', () => {
    it('should flatten and get unique columns', () => {
      const data = [
        { a: { x: 1 }, b: 2 },
        { a: { y: 3 }, c: 4 },
      ];
      const result = exporter.testFlattenAndGetUnique(data);
      expect(result).toContain('a.x');
      expect(result).toContain('a.y');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });
  });
});
