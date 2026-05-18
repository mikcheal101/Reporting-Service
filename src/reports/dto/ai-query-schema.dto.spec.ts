import 'reflect-metadata';
import { AiQuerySchemaDto } from './ai-query-schema.dto';

describe('AiQuerySchemaDto', () => {
  it('should create a valid dto', () => {
    const dto = new AiQuerySchemaDto();
    dto.table = 'users';
    dto.columns = 'id, name, email';
    expect(dto.table).toBe('users');
    expect(dto.columns).toBe('id, name, email');
  });
});
