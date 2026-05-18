import 'reflect-metadata';
import { UserResponseDto } from './user-response.dto';

describe('UserResponseDto', () => {
  it('should create a valid dto', () => {
    const dto = new UserResponseDto();
    dto.id = 1;
    dto.username = 'test@test.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.phoneNumber = '+1234567890';
    dto.isActive = true;
    expect(dto.id).toBe(1);
    expect(dto.username).toBe('test@test.com');
    expect(dto.isActive).toBe(true);
  });
});
