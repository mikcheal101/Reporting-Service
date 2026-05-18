import 'reflect-metadata';
import { ConnectionDto } from './connection.dto';

describe('ConnectionDto', () => {
  it('should create a valid dto', () => {
    const dto = new ConnectionDto();
    dto.id = 1;
    dto.name = 'Test Connection';
    dto.server = 'localhost';
    dto.port = 1433;
    dto.database = 'testdb';
    expect(dto.id).toBe(1);
    expect(dto.name).toBe('Test Connection');
    expect(dto.port).toBe(1433);
  });
});
