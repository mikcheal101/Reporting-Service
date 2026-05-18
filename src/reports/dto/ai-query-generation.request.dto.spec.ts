import 'reflect-metadata';
import { AiQueryGenerationRequestDto } from './ai-query-generation.request.dto';

describe('AiQueryGenerationRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new AiQueryGenerationRequestDto();
    dto.reportId = 1 as any;
    dto.prompt = 'Show all users';
    dto.schemas = [];
    expect(dto.reportId).toBe(1);
    expect(dto.prompt).toBe('Show all users');
    expect(dto.schemas).toEqual([]);
  });
});
