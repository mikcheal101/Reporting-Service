import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';

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
    }).compile();

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

      const result = await controller.getMetricsAsync();

      expect(result).toEqual(expectedMetrics);
      expect(mockDashboardService.getMetricsAsync).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from dashboard service', async () => {
      mockDashboardService.getMetricsAsync.mockRejectedValue(
        new Error('Metrics error'),
      );

      await expect(controller.getMetricsAsync()).rejects.toThrow(
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

      const result = await controller.getInsightsAsync();

      expect(result).toEqual(expectedInsights);
      expect(mockDashboardAiService.getInsightsAsync).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no insights', async () => {
      mockDashboardAiService.getInsightsAsync.mockResolvedValue([]);

      const result = await controller.getInsightsAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors from AI service', async () => {
      mockDashboardAiService.getInsightsAsync.mockRejectedValue(
        new Error('AI error'),
      );

      await expect(controller.getInsightsAsync()).rejects.toThrow('AI error');
    });
  });
});
