import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm: string = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    const secret: string = process.env.ENCRYPTION_KEY || '';
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  encrypt(message: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encryptedText = Buffer.concat([
      cipher.update(message, 'utf8'),
      cipher.final(),
    ]);
    return iv.toString('hex') + ':' + encryptedText.toString('hex');
  }

  decrypt(cipher: string): string {
    const [ivHex, encryptedHex] = cipher.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    const plainText = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return plainText.toString('utf8');
  }
}
