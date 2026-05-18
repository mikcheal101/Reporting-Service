import 'reflect-metadata';
import { UpdateConnectionRequestDto } from './update-connection.request.dto';
import { DatabaseType } from '../databasetype.enum';

describe('UpdateConnectionRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new UpdateConnectionRequestDto();
    dto.name = 'Test';
    dto.server = 'localhost';
    dto.port = 1433;
    dto.user = 'sa';
    dto.password = 'pass';
    dto.database = 'testdb';
    dto.databaseType = DatabaseType.MSSQL;
    dto.isTestSuccessful = true;
    expect(dto.name).toBe('Test');
    expect(dto.isTestSuccessful).toBe(true);
  });
});
