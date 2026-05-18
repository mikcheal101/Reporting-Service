import { Test, TestingModule } from '@nestjs/testing';
import { CronUtil } from './cron.utils';
import { Frequency } from 'src/report-types/entity/frequency.enum';
import { Logger } from '@nestjs/common';

describe('CronUtil', () => {
  let cronUtil: CronUtil;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronUtil],
    }).compile();

    cronUtil = module.get<CronUtil>(CronUtil);
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  const baseDate = new Date('2025-06-15T10:30:45');

  it('should generate cron for ON_REQUEST', () => {
    const result = cronUtil.dateToCron(baseDate, Frequency.ON_REQUEST);
    expect(result).toBe('45 30 10 15 6 *');
  });

  it('should generate cron for ANNUALLY', () => {
    const result = cronUtil.dateToCron(baseDate, Frequency.ANNUALLY);
    expect(result).toBe('45 30 10 15 6 *');
  });

  it('should generate cron for DAILY', () => {
    const result = cronUtil.dateToCron(baseDate, Frequency.DAILY);
    expect(result).toBe('45 30 10 * * *');
  });

  it('should generate cron for WEEKLY', () => {
    const result = cronUtil.dateToCron(baseDate, Frequency.WEEKLY);
    expect(result).toBe('45 30 10 * * *');
  });

  it('should generate cron for MONTHLY', () => {
    const result = cronUtil.dateToCron(baseDate, Frequency.MONTHLY);
    expect(result).toBe('45 30 10 15 * *');
  });

  it('should generate cron for BI_ANNUALLY with months in same year', () => {
    const date = new Date('2025-03-10T08:20:30');
    const result = cronUtil.dateToCron(date, Frequency.BI_ANNUALLY);
    expect(result).toBe('30 20 8 10 3,9 *');
  });

  it('should generate cron for BI_ANNUALLY with rollover to next year', () => {
    const date = new Date('2025-09-10T08:20:30');
    const result = cronUtil.dateToCron(date, Frequency.BI_ANNUALLY);
    expect(result).toBe('30 20 8 10 9,3 *');
  });

  it('should generate cron for BI_ANNUALLY in December', () => {
    const date = new Date('2025-12-01T00:00:00');
    const result = cronUtil.dateToCron(date, Frequency.BI_ANNUALLY);
    expect(result).toBe('0 0 0 1 12,6 *');
  });

  it('should throw for unexpected frequency', () => {
    expect(() => cronUtil.dateToCron(baseDate, -1 as Frequency)).toThrow(
      'Unexpected Frequency: -1',
    );
  });

  it('should handle date at midnight', () => {
    const date = new Date('2025-01-01T00:00:00');
    const result = cronUtil.dateToCron(date, Frequency.DAILY);
    expect(result).toBe('0 0 0 * * *');
  });

  it('should handle date with single digit values', () => {
    const date = new Date('2025-01-05T09:05:03');
    const result = cronUtil.dateToCron(date, Frequency.DAILY);
    expect(result).toBe('3 5 9 * * *');
  });
});
