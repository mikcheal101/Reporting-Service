export abstract class ReportExporter {
  protected flattenObject(obj: any, parentKey: string = '', result = {}): any {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const value = obj[key];
      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.flattenObject(value, newKey, result);
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  protected flattenObjectArray(data: any[]): any[] {
    return data.map((datum) => this.flattenObject(datum));
  }

  protected getUniqueColumns(flattened: any): any[] {
    return Array.from(new Set(flattened.flatMap((row) => Object.keys(row))));
  }

  protected flattenAndGetUniqueColumns(data: any[]): any[] {
    const flattened = this.flattenObjectArray(data);
    return this.getUniqueColumns(flattened);
  }
}
