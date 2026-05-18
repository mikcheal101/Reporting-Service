import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  const OLD_ENV = process.env;

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('with encryption key set', () => {
    beforeAll(() => {
      process.env.ENCRYPTION_KEY = 'test-encryption-key-32bytes!';
    });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [CryptoService],
      }).compile();

      cryptoService = module.get<CryptoService>(CryptoService);
    });

    it('should encrypt and decrypt a message', () => {
      const original = 'Hello, World!';
      const encrypted = cryptoService.encrypt(original);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(original);
      expect(encrypted).toContain(':');

      const decrypted = cryptoService.decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same message (different IV)', () => {
      const original = 'Same message';
      const encrypted1 = cryptoService.encrypt(original);
      const encrypted2 = cryptoService.encrypt(original);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should decrypt returns empty string for empty input', () => {
      const result = cryptoService.decrypt('');
      expect(result).toBe('');
    });

    it('should encrypt and decrypt a long message', () => {
      const original = 'A'.repeat(10000);
      const encrypted = cryptoService.encrypt(original);
      const decrypted = cryptoService.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt message with special characters', () => {
      const original = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?~`\'"\\\n\t';
      const encrypted = cryptoService.encrypt(original);
      const decrypted = cryptoService.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt unicode characters', () => {
      const original = 'Unicode: 你好, ñoño, café, über, 日本語';
      const encrypted = cryptoService.encrypt(original);
      const decrypted = cryptoService.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt empty string', () => {
      const original = '';
      const encrypted = cryptoService.encrypt(original);
      const decrypted = cryptoService.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should throw when decrypting malformed ciphertext', () => {
      expect(() => cryptoService.decrypt('invalid-format')).toThrow();
    });

    it('should throw when decrypting with only iv part', () => {
      expect(() => cryptoService.decrypt('onlyivhex')).toThrow();
    });
  });

  describe('without encryption key', () => {
    beforeAll(() => {
      delete process.env.ENCRYPTION_KEY;
    });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [CryptoService],
      }).compile();

      cryptoService = module.get<CryptoService>(CryptoService);
    });

    it('should still be able to encrypt and decrypt', () => {
      const original = 'fallback test';
      const encrypted = cryptoService.encrypt(original);
      const decrypted = cryptoService.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });
  });
});
