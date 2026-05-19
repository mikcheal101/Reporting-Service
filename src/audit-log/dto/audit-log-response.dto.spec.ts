import { AuditLogResponseDto } from './audit-log-response.dto';

describe('AuditLogResponseDto', () => {
  it('should create a valid DTO', () => {
    const dto: AuditLogResponseDto = {
      id: 1,
      userId: 1,
      username: 'admin',
      action: 'POST',
      entity: 'users',
      entityId: 5,
      details: '{"name":"test"}',
      ipAddress: '::1',
      createdAt: new Date(),
    };

    expect(dto.id).toBe(1);
    expect(dto.action).toBe('POST');
    expect(dto.entity).toBe('users');
  });
});
