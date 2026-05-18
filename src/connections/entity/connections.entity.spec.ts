import 'reflect-metadata';
import { Connection } from './connections.entity';
import { Report } from 'src/reports/entity/report.entity';

describe('Connection Entity', () => {
  it('should create a connection instance', () => {
    const connection = new Connection();
    connection.id = 1;
    connection.name = 'Test DB';
    connection.server = 'localhost';
    connection.port = 1433;
    connection.user = 'sa';
    connection.password = 'pass';
    connection.database = 'testdb';
    connection.isTestSuccessful = false;
    expect(connection.isTestSuccessful).toBe(false);
    expect(connection.name).toBe('Test DB');
  });

  it('should support report relation', () => {
    const connection = new Connection();
    const report = new Report();
    report.id = 1;
    connection.reports = [report];
    expect(connection.reports).toHaveLength(1);
  });
});
