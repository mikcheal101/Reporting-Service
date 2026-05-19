import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { RequirePermission } from '../auth/decorator/require-permission.decorator';
import {
  ComplianceCheckResult,
  ComplianceReportDto,
  ComplianceStandard,
} from './dto/compliance-report.dto';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @HttpCode(HttpStatus.OK)
  @Get('check')
  @RequirePermission('compliance-report.view')
  public async runCheck(
    @Query('standard') standard?: ComplianceStandard,
  ): Promise<ComplianceCheckResult | ComplianceCheckResult[]> {
    if (standard) {
      return this.complianceService.runComplianceCheck(standard);
    }
    return this.complianceService.runAllChecks();
  }

  @HttpCode(HttpStatus.OK)
  @Post('report')
  @RequirePermission('compliance-report.create')
  public async generateReport(
    @Req() request: Request,
  ): Promise<ComplianceReportDto> {
    return this.complianceService.generateReport(request.user?.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('report')
  @RequirePermission('compliance-report.list')
  public async getLatestReport(): Promise<ComplianceReportDto> {
    return this.complianceService.generateReport();
  }
}
