import 'reflect-metadata';
import { ConnectionTablesResponseDto } from './connection-tables.response.dto';

describe('ConnectionTablesResponseDto', () => {
  it('should create a valid dto', () => {
    const dto = new ConnectionTablesResponseDto();
    dto.tableName = 'users';
    dto.columns = [];
    expect(dto.tableName).toBe('users');
    expect(dto.columns).toEqual([]);
  });
});
