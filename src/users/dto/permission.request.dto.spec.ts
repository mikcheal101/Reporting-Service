import 'reflect-metadata';
import PermissionRequestDto from './permission.request.dto';

describe('PermissionRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new PermissionRequestDto();
    dto.id = 1;
    expect(dto.id).toBe(1);
  });
});
