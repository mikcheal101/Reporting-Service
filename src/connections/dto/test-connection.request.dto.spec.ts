import 'reflect-metadata';
import { TestConnectionRequestDto } from './test-connection.request.dto';
import { DatabaseType } from '../databasetype.enum';

describe('TestConnectionRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new TestConnectionRequestDto();
    dto.name = 'Test';
    dto.server = 'localhost';
    dto.port = 1433;
    dto.user = 'sa';
    dto.password = 'pass';
    dto.database = 'testdb';
    dto.databaseType = DatabaseType.MSSQL;
    expect(dto.name).toBe('Test');
    expect(dto.database).toBe('testdb');
  });
});
