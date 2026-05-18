import 'reflect-metadata';
import { SignUpRequestDto } from './signup.request.dto';

describe('SignUpRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new SignUpRequestDto();
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.email = 'john@test.com';
    dto.password = 'password123';
    dto.phoneNumber = '+1234567890';
    expect(dto.firstName).toBe('John');
    expect(dto.lastName).toBe('Doe');
    expect(dto.email).toBe('john@test.com');
    expect(dto.phoneNumber).toBe('+1234567890');
  });
});
