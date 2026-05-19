import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(cookieParser());

  app.enableShutdownHooks();

  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4050;

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`CORS enabled for: ${frontendUrl}`);
}
bootstrap();
