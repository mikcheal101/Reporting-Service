import 'reflect-metadata';
import { SignInResponseData } from './signin.response.data.dto';

describe('SignInResponseData', () => {
  it('should create a valid dto', () => {
    const dto = new SignInResponseData();
    dto.token = 'jwt-token';
    dto.expiration = '3600';
    expect(dto.token).toBe('jwt-token');
    expect(dto.expiration).toBe('3600');
  });
});
