import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardAiService } from './dashboard-ai.service';
import { Report } from 'src/reports/entity/report.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { ReportDetail } from 'src/reports/entity/report-detail.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { AuditLog } from 'src/audit-log/entity/audit-log.entity';

const mockQueryBuilder = (returnValue: any) => ({
  leftJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(returnValue),
  getRawOne: jest.fn().mockResolvedValue(returnValue?.[0] ?? null),
});

describe('DashboardAiService', () => {
  let service: DashboardAiService;

  const mockReportRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTaskRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockConnectionRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuditLogRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));
    mockReportRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder([]),
    );
    mockConnectionRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder([]),
    );
    mockReportRepository.find.mockResolvedValue([]);
    mockConnectionRepository.find.mockResolvedValue([]);
    mockAuditLogRepository.count.mockResolvedValue(0);
    mockAuditLogRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder([]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardAiService,
        { provide: getRepositoryToken(Report), useValue: mockReportRepository },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: getRepositoryToken(ReportDetail), useValue: {} },
        {
          provide: getRepositoryToken(Connection),
          useValue: mockConnectionRepository,
        },
        { provide: getRepositoryToken(ReportType), useValue: {} },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardAiService>(DashboardAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInsightsAsync', () => {
    it('should return combined insights sorted by priority descending', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(
          mockQueryBuilder([
            { reportId: 1, reportName: 'Fail Rpt', total: 10, failures: 5 },
          ]),
        )
        .mockReturnValueOnce(
          mockQueryBuilder([
            { reportId: 2, reportName: 'Slow Rpt', avgDuration: 150 },
          ]),
        );

      mockReportRepository.createQueryBuilder
        .mockReturnValueOnce(
          mockQueryBuilder([{ reportId: 3, reportName: 'No Details' }]),
        )
        .mockReturnValueOnce(
          mockQueryBuilder([{ reportId: 4, reportName: 'No Task' }]),
        );

      mockConnectionRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder([{ reportId: 5, reportName: 'Unused Conn' }]),
      );

      mockReportRepository.find.mockResolvedValue([
        {
          id: 6,
          name: 'Stale Rpt',
          updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      ]);

      mockConnectionRepository.find.mockResolvedValue([
        { id: 7, name: 'Failed Conn', isTestSuccessful: false },
      ]);

      const insights = await service.getInsightsAsync();

      expect(insights).toHaveLength(7);
      for (let i = 1; i < insights.length; i++) {
        expect(insights[i - 1].priority).toBeGreaterThanOrEqual(
          insights[i].priority,
        );
      }
    });

    it('should return empty array when all sub-queries return empty', async () => {
      const insights = await service.getInsightsAsync();
      expect(insights).toEqual([]);
    });

    it('should propagate errors from sub-queries', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(service.getInsightsAsync()).rejects.toThrow('DB error');
    });
  });

  describe('getHighFailureReportsAsync', () => {
    it('should map failure data with critical severity when rate > 30%', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder([
          { reportId: 1, reportName: 'Bad Report', total: 10, failures: 5 },
        ]),
      );

      const result = await service.getInsightsAsync();
      const insight = result.find((i) => i.id === 'failure-1');

      expect(insight).toBeDefined();
      expect(insight.severity).toBe('critical');
      expect(insight.priority).toBe(9);
      expect(insight.analysisType).toBe('performance');
    });

    it('should set high severity when rate 16-30%', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder([
          { reportId: 2, reportName: 'Med Report', total: 20, failures: 4 },
        ]),
      );

      const result = await service.getInsightsAsync();
      const insight = result.find((i) => i.id === 'failure-2');

      expect(insight).toBeDefined();
      expect(insight.severity).toBe('high');
      expect(insight.priority).toBe(7);
    });

    it('should set medium severity when rate <= 15%', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder([
          { reportId: 3, reportName: 'Low Report', total: 100, failures: 10 },
        ]),
      );

      const result = await service.getInsightsAsync();
      const insight = result.find((i) => i.id === 'failure-3');

      expect(insight).toBeDefined();
      expect(insight.severity).toBe('medium');
      expect(insight.priority).toBe(5);
    });
  });

  describe('getSlowestReportsAsync', () => {
    it('should map slow reports with severity based on avg duration', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(
          mockQueryBuilder([
            { reportId: 1, reportName: 'Slow Rpt', avgDuration: 200 },
          ]),
        );

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'slow-1');

      expect(insight).toBeDefined();
      expect(insight.severity).toBe('high');
      expect(insight.priority).toBe(8);
      expect(insight.description).toContain('3 min');
    });

    it('should format duration in seconds when under 60', async () => {
      mockTaskRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(
          mockQueryBuilder([
            { reportId: 2, reportName: 'Fast Rpt', avgDuration: 30 },
          ]),
        );

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'slow-2');

      expect(insight.severity).toBe('low');
      expect(insight.priority).toBe(4);
      expect(insight.description).toContain('30 sec');
    });
  });

  describe('getReportsMissingDetailsAsync', () => {
    it('should generate insight for reports with no field definitions', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder([{ reportId: 10, reportName: 'No Fields' }]),
      );

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'details-10');

      expect(insight).toBeDefined();
      expect(insight.analysisType).toBe('data_quality');
      expect(insight.severity).toBe('medium');
      expect(insight.priority).toBe(6);
      expect(insight.role).toBe('manager');
    });
  });

  describe('getUnusedConnectionsAsync', () => {
    it('should generate insight for unused connections', async () => {
      mockConnectionRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder([{ reportId: 20, reportName: 'Ghost Conn' }]),
      );

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'unused-20');

      expect(insight).toBeDefined();
      expect(insight.analysisType).toBe('optimization');
      expect(insight.severity).toBe('low');
      expect(insight.priority).toBe(3);
    });
  });

  describe('getStaleReportsAsync', () => {
    it('should generate insight for stale reports', async () => {
      mockReportRepository.find.mockResolvedValue([
        {
          id: 30,
          name: 'Old Report',
          updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      ]);

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'stale-30');

      expect(insight).toBeDefined();
      expect(insight.analysisType).toBe('compliance');
      expect(insight.severity).toBe('medium');
      expect(insight.priority).toBe(5);
    });

    it('should call find with LessThan and take 3', async () => {
      await service.getInsightsAsync();

      expect(mockReportRepository.find).toHaveBeenCalledWith({
        where: {
          updatedAt: expect.objectContaining({
            '@instanceof': expect.anything(),
          }),
        },
        order: { updatedAt: 'ASC' },
        take: 3,
      });
    });
  });

  describe('getFailedConnectionsAsync', () => {
    it('should generate critical insight for failed connections', async () => {
      mockConnectionRepository.find.mockResolvedValue([
        { id: 40, name: 'Broken Conn', isTestSuccessful: false },
      ]);

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'conn-fail-40');

      expect(insight).toBeDefined();
      expect(insight.severity).toBe('critical');
      expect(insight.priority).toBe(10);
      expect(insight.analysisType).toBe('compliance');
    });

    it('should call find with isTestSuccessful false', async () => {
      await service.getInsightsAsync();

      expect(mockConnectionRepository.find).toHaveBeenCalledWith({
        where: { isTestSuccessful: false },
        take: 3,
      });
    });
  });

  describe('getReportsWithoutTasksAsync', () => {
    it('should generate insight for unscheduled reports', async () => {
      mockReportRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([]))
        .mockReturnValueOnce(
          mockQueryBuilder([{ reportId: 50, reportName: 'Manual Rpt' }]),
        );

      const insights = await service.getInsightsAsync();
      const insight = insights.find((i) => i.id === 'no-task-50');

      expect(insight).toBeDefined();
      expect(insight.analysisType).toBe('optimization');
      expect(insight.severity).toBe('low');
      expect(insight.priority).toBe(4);
      expect(insight.role).toBe('analyst');
    });
  });
});
