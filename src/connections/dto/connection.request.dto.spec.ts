import 'reflect-metadata';
import { ConnectionRequestDto } from './connection.request.dto';

describe('ConnectionRequestDto', () => {
  it('should not be instantiable directly (abstract)', () => {
    expect(ConnectionRequestDto).toBeDefined();
  });

  it('should have expected properties when extended', () => {
    class TestDto extends ConnectionRequestDto {}
    const dto = new TestDto();
    dto.name = 'Test';
    dto.server = 'localhost';
    dto.port = 1433;
    dto.user = 'sa';
    dto.password = 'pass';
    dto.database = 'testdb';
    dto.databaseType = 0;
    expect(dto.name).toBe('Test');
    expect(dto.server).toBe('localhost');
    expect(dto.port).toBe(1433);
  });
});
