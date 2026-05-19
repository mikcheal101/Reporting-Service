import { Test, TestingModule } from '@nestjs/testing';
import { SentryFilter } from './sentry.filter';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SentryFilter', () => {
  let filter: SentryFilter;
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SentryFilter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    filter = module.get<SentryFilter>(SentryFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch HTTP exceptions and return proper response', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest.fn().mockReturnValue({ url: '/test', method: 'GET', body: {} });
    const host = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    };

    filter.catch(new HttpException('Not Found', HttpStatus.NOT_FOUND), host as any);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        path: '/test',
      }),
    );
  });
});
