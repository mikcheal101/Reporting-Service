import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { RequirePermission } from '../auth/decorator/require-permission.decorator';
import { Request } from 'express';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardAiService: DashboardAiService,
  ) {}

  @RequirePermission('report.list')
  @HttpCode(HttpStatus.OK)
  @Get('metrics')
  public async getMetricsAsync(@Req() request: Request) {
    return await this.dashboardService.getMetricsAsync(request.user?.id);
  }

  @RequirePermission('report.list')
  @HttpCode(HttpStatus.OK)
  @Get('insights')
  public async getInsightsAsync(@Req() request: Request) {
    return await this.dashboardAiService.getInsightsAsync(request.user?.id);
  }
}
