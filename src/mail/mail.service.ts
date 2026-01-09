import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger: Logger;

  constructor(private readonly mailerService: MailerService) {
    this.logger = new Logger(MailService.name);
  }

  public send = async (
    to: string[],
    subject: string,
    attachment: { filename: string; buffer: Buffer },
    body: string = '',
  ): Promise<boolean> => {
    try {
      this.logger.log('sending message:');
      await this.mailerService.sendMail({
        to,
        subject,
        text: body,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.buffer,
          },
        ],
      });
      this.logger.log('message sent!');
      return true;
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }
}
