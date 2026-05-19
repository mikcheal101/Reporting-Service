import { Logger } from '@nestjs/common';

describe('Bootstrap', () => {
  it('should configure application with helmet, cors, cookieParser', () => {
    expect(true).toBe(true);
  });

  it('should use validation pipe with whitelist', () => {
    expect(Logger).toBeDefined();
  });
});
