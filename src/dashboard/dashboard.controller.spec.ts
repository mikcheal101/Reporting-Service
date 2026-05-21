import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { PermissionGuard } from 'src/auth/guard/permission.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: DashboardService;
  let dashboardAiService: DashboardAiService;

  const mockDashboardService = {
    getMetricsAsync: jest.fn(),
  };

  const mockDashboardAiService = {
    getInsightsAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: DashboardAiService, useValue: mockDashboardAiService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get<DashboardService>(DashboardService);
    dashboardAiService = module.get<DashboardAiService>(DashboardAiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetricsAsync', () => {
    it('should return metrics from dashboard service', async () => {
      const expectedMetrics = {
        reportStats: { totalReports: 10 },
        reportsByType: [],
        reportsByStatus: [],
        executionTrends: [],
        topPerformingReports: [],
        errorRates: [],
        connectionCount: 5,
        userCount: 3,
        reportTypeCount: 2,
      };
      mockDashboardService.getMetricsAsync.mockResolvedValue(expectedMetrics);
      const req = { user: { id: 1 } } as any;

      const result = await controller.getMetricsAsync(req);

      expect(result).toEqual(expectedMetrics);
      expect(mockDashboardService.getMetricsAsync).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from dashboard service', async () => {
      mockDashboardService.getMetricsAsync.mockRejectedValue(
        new Error('Metrics error'),
      );
      const req = { user: { id: 1 } } as any;

      await expect(controller.getMetricsAsync(req)).rejects.toThrow(
        'Metrics error',
      );
    });
  });

  describe('getInsightsAsync', () => {
    it('should return insights from AI service', async () => {
      const expectedInsights = [
        { id: 'failure-1', title: 'High Failure', priority: 9 },
        { id: 'slow-1', title: 'Slow Query', priority: 8 },
      ];
      mockDashboardAiService.getInsightsAsync.mockResolvedValue(
        expectedInsights,
      );
      const req = { user: { id: 1 } } as any;

      const result = await controller.getInsightsAsync(req);

      expect(result).toEqual(expectedInsights);
      expect(mockDashboardAiService.getInsightsAsync).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no insights', async () => {
      mockDashboardAiService.getInsightsAsync.mockResolvedValue([]);
      const req = { user: { id: 1 } } as any;

      const result = await controller.getInsightsAsync(req);

      expect(result).toEqual([]);
    });

    it('should propagate errors from AI service', async () => {
      mockDashboardAiService.getInsightsAsync.mockRejectedValue(
        new Error('AI error'),
      );
      const req = { user: { id: 1 } } as any;

      await expect(controller.getInsightsAsync(req)).rejects.toThrow('AI error');
    });
  });
});
