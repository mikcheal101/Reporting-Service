import 'reflect-metadata';
import UpdateUserDto from './update-user.dto';

describe('UpdateUserDto', () => {
  it('should create a valid dto', () => {
    const dto = new UpdateUserDto();
    dto.username = 'test@test.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.phone = '+1234567890';
    expect(dto.username).toBe('test@test.com');
    expect(dto.phone).toBe('+1234567890');
  });
});
