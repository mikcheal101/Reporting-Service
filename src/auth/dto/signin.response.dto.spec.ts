import 'reflect-metadata';
import { SignInResponseDto } from './signin.response.dto';

describe('SignInResponseDto', () => {
  it('should create a valid dto', () => {
    const dto = new SignInResponseDto();
    dto.success = true;
    dto.message = 'Login successful';
    dto.timestamp = new Date().toISOString();
    expect(dto.success).toBe(true);
    expect(dto.message).toBe('Login successful');
  });
});
