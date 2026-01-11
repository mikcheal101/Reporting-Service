import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.use(cookieParser());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4050;

  await app.listen(port);

  // Log the URL for confirmation
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌐 CORS enabled for: ${frontendUrl}`);
}
bootstrap();
