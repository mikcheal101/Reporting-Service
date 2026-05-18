import 'reflect-metadata';
import { QueryParameterDto } from './query-parameter.dto';

describe('QueryParameterDto', () => {
  it('should create a valid dto', () => {
    const dto = new QueryParameterDto();
    dto.name = 'param1';
    dto.value = 'value1';
    dto.dataType = 'string';
    expect(dto.name).toBe('param1');
    expect(dto.value).toBe('value1');
    expect(dto.dataType).toBe('string');
  });
});
