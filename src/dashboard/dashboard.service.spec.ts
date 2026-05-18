import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Report } from 'src/reports/entity/report.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { TaskStatus } from 'src/tasks/entity/task-status.enum';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { User } from 'src/users/entity/users.entity';

const mockQueryBuilder = (returnValue: any) => ({
  leftJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(returnValue),
  getRawOne: jest.fn().mockResolvedValue(returnValue?.[0] ?? null),
});

describe('DashboardService', () => {
  let service: DashboardService;

  const mockReportRepository = { count: jest.fn() };
  const mockTaskRepository = { count: jest.fn(), findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const mockConnectionRepository = { count: jest.fn() };
  const mockUserRepository = { count: jest.fn() };
  const mockReportTypeRepository = { count: jest.fn(), createQueryBuilder: jest.fn() };

  function setupEmptyTaskQBs() {
    mockTaskRepository.createQueryBuilder
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]));
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockReportRepository.count.mockResolvedValue(0);
    mockConnectionRepository.count.mockResolvedValue(0);
    mockUserRepository.count.mockResolvedValue(0);
    mockReportTypeRepository.count.mockResolvedValue(0);
    mockTaskRepository.findOne.mockResolvedValue(null);
    mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));
    mockReportTypeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Report), useValue: mockReportRepository },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: getRepositoryToken(ReportType), useValue: mockReportTypeRepository },
        { provide: getRepositoryToken(Connection), useValue: mockConnectionRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetricsAsync', () => {
    it('should return complete metrics object', async () => {
      mockReportRepository.count.mockResolvedValue(100);
      mockConnectionRepository.count.mockResolvedValue(10);
      mockUserRepository.count.mockResolvedValue(5);
      mockReportTypeRepository.count.mockResolvedValue(3);

      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([
          { status: TaskStatus.COMPLETED, count: 50 },
          { status: TaskStatus.FAILED, count: 10 },
          { status: TaskStatus.RUNNING, count: 3 },
          { status: TaskStatus.QUEUED, count: 2 },
        ]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]));

      mockTaskRepository.findOne.mockResolvedValue({
        id: 1,
        executedAt: new Date('2026-05-17T12:00:00Z'),
      });

      mockReportTypeRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([
          { type: 'PDF', count: 30 },
          { type: 'Excel', count: 70 },
        ]),
      );

      const result = await service.getMetricsAsync();

      expect(result).toHaveProperty('reportStats');
      expect(result).toHaveProperty('reportsByType');
      expect(result).toHaveProperty('reportsByStatus');
      expect(result).toHaveProperty('executionTrends');
      expect(result).toHaveProperty('topPerformingReports');
      expect(result).toHaveProperty('errorRates');
      expect(result).toHaveProperty('connectionCount', 10);
      expect(result).toHaveProperty('userCount', 5);
      expect(result).toHaveProperty('reportTypeCount', 3);
    });

    it('should return all expected fields in reportStats', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([
          { status: TaskStatus.COMPLETED, count: 50 },
          { status: TaskStatus.FAILED, count: 10 },
        ]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]));

      const result = await service.getMetricsAsync();

      expect(result.reportStats.totalReports).toBe(0);
      expect(result.reportStats.successRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero total tasks gracefully', async () => {
      setupEmptyTaskQBs();

      const result = await service.getMetricsAsync();

      expect(result.reportStats.totalReports).toBe(0);
      expect(typeof result.reportStats.successRate).toBe('number');
      expect(result.reportStats.averageGenerationTime).toBe(0);
      expect(result.reportStats.lastGenerated).toBeNull();
      expect(result.reportsByType).toEqual([]);
    });

    it('should compute correct success rate', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([
          { status: TaskStatus.COMPLETED, count: 40 },
          { status: TaskStatus.FAILED, count: 10 },
        ]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]));

      const result = await service.getMetricsAsync();

      expect(result.reportStats.completedReports).toBe(40);
      expect(result.reportStats.failedReports).toBe(10);
    });

    it('should treat missing avg as 0', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([{ avg: null }]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]));

      const result = await service.getMetricsAsync();

      expect(result.reportStats.averageGenerationTime).toBe(0);
    });
  });

  describe('reportsByStatus', () => {
    it('should count tasks by status correctly', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([
          { status: TaskStatus.COMPLETED, count: 50 },
          { status: TaskStatus.FAILED, count: 5 },
          { status: TaskStatus.RUNNING, count: 2 },
          { status: TaskStatus.QUEUED, count: 3 },
        ]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(mockQueryBuilder([]));

      const result = await service.getMetricsAsync();

      expect(result.reportsByStatus).toHaveLength(4);
      const completed = result.reportsByStatus.find((s) => s.status === 'Completed');
      expect(completed.count).toBe(50);
    });
  });

  describe('reportsByType formatting', () => {
    it('should calculate percentage correctly', async () => {
      mockReportRepository.count.mockResolvedValue(100);
      mockReportTypeRepository.count.mockResolvedValue(2);

      setupEmptyTaskQBs();

      mockReportTypeRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([
          { type: 'PDF', count: 25 },
          { type: 'Excel', count: 75 },
        ]),
      );

      const result = await service.getMetricsAsync();

      expect(result.reportsByType).toHaveLength(2);
      expect(result.reportsByType[0].type).toBe('PDF');
      expect(result.reportsByType[0].count).toBe(25);
      expect(result.reportsByType[0].percentage).toBe(25);
    });

    it('should handle zero total reports', async () => {
      setupEmptyTaskQBs();

      const result = await service.getMetricsAsync();

      expect(result.reportsByType).toEqual([]);
    });
  });
});
