import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RequirePermission } from '../auth/decorator/require-permission.decorator';

@UseGuards(AuthGuard)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAiService: DashboardAiService,
  ) {}

  @RequirePermission('report.list')
  @HttpCode(HttpStatus.OK)
  @Get('metrics')
  public async getMetricsAsync() {
    return await this.dashboardService.getMetricsAsync();
  }

  @RequirePermission('report.list')
  @HttpCode(HttpStatus.OK)
  @Get('insights')
  public async getInsightsAsync() {
    return await this.dashboardAiService.getInsightsAsync();
  }
}
