import 'reflect-metadata';
import { ConnectionColumnDto } from './connection-column.dto';

describe('ConnectionColumnDto', () => {
  it('should create a valid dto', () => {
    const dto = new ConnectionColumnDto();
    dto.columnName = 'id';
    dto.dataType = 'int';
    expect(dto.columnName).toBe('id');
    expect(dto.dataType).toBe('int');
  });
});
