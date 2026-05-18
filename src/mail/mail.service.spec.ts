import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    const attachment = {
      filename: 'report.pdf',
      buffer: Buffer.from('test content'),
    };

    it('should send an email successfully', async () => {
      mockMailerService.sendMail.mockResolvedValue({ messageId: '123' });

      const result = await service.send(
        ['recipient@test.com'],
        'Test Subject',
        attachment,
        'Email body',
      );

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: ['recipient@test.com'],
        subject: 'Test Subject',
        text: 'Email body',
        attachments: [
          {
            filename: 'report.pdf',
            content: Buffer.from('test content'),
          },
        ],
      });
    });

    it('should send an email without body', async () => {
      mockMailerService.sendMail.mockResolvedValue({ messageId: '123' });

      const result = await service.send(
        ['recipient@test.com'],
        'Test Subject',
        attachment,
      );

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: ['recipient@test.com'],
        subject: 'Test Subject',
        text: '',
        attachments: [
          {
            filename: 'report.pdf',
            content: Buffer.from('test content'),
          },
        ],
      });
    });

    it('should return false when mailer service throws', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await service.send(
        ['recipient@test.com'],
        'Test Subject',
        attachment,
      );

      expect(result).toBe(false);
    });

    it('should send to multiple recipients', async () => {
      mockMailerService.sendMail.mockResolvedValue({ messageId: '123' });

      const recipients = ['user1@test.com', 'user2@test.com'];
      const result = await service.send(recipients, 'Test', attachment);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: recipients }),
      );
    });
  });
});
