jest.mock('nestjs-pino', () => ({
  LoggerModule: {
    forRoot: jest.fn().mockReturnValue({ module: 'LoggerModule', providers: [], exports: [] }),
  },
  Logger: jest.fn().mockImplementation(() => ({ log: jest.fn(), error: jest.fn(), warn: jest.fn() })),
}));

jest.mock('@opentelemetry/api', () => ({
  trace: { getTracer: jest.fn().mockReturnValue({ startSpan: jest.fn().mockReturnValue({ end: jest.fn(), setAttribute: jest.fn() }) }) },
  Span: jest.fn(),
}));

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });
});
