import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAiService: DashboardAiService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get('metrics')
  public async getMetricsAsync() {
    return await this.dashboardService.getMetricsAsync();
  }

  @HttpCode(HttpStatus.OK)
  @Get('insights')
  public async getInsightsAsync() {
    return await this.dashboardAiService.getInsightsAsync();
  }
}
