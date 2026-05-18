import 'reflect-metadata';
import CreateUserDto from './create-user.dto';

describe('CreateUserDto', () => {
  it('should create a valid dto', () => {
    const dto = new CreateUserDto();
    dto.username = 'test@test.com';
    dto.password = 'password123';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.phone = '+1234567890';
    expect(dto.username).toBe('test@test.com');
    expect(dto.firstName).toBe('John');
  });
});
