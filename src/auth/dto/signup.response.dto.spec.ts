import 'reflect-metadata';
import { SignUpResponseDto } from './signup.response.dto';

describe('SignUpResponseDto', () => {
  it('should create a valid dto', () => {
    const dto = new SignUpResponseDto();
    dto.isCreated = true;
    expect(dto.isCreated).toBe(true);
  });
});
