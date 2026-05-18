import 'reflect-metadata';
import { QueryRequestDto } from './query.request.dto';

describe('QueryRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new QueryRequestDto();
    dto.computedColumns = [];
    dto.filters = [];
    dto.isFromQueryBuilder = true;
    dto.joins = [];
    dto.limit = 10;
    dto.queryString = 'SELECT * FROM users';
    dto.reportId = '1';
    expect(dto.isFromQueryBuilder).toBe(true);
    expect(dto.limit).toBe(10);
    expect(dto.queryString).toBe('SELECT * FROM users');
  });
});
