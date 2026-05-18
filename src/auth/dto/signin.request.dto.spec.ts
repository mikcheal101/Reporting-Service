import 'reflect-metadata';
import { SignInRequestDto } from './signin.request.dto';

describe('SignInRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new SignInRequestDto();
    dto.email = 'test@test.com';
    dto.password = 'password123';
    expect(dto.email).toBe('test@test.com');
    expect(dto.password).toBe('password123');
  });
});
