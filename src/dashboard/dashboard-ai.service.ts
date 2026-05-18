import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Report } from 'src/reports/entity/report.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { TaskStatus } from 'src/tasks/entity/task-status.enum';
import { ReportDetail } from 'src/reports/entity/report-detail.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';

@Injectable()
export class DashboardAiService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ReportDetail)
    private readonly reportDetailRepository: Repository<ReportDetail>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(ReportType)
    private readonly reportTypeRepository: Repository<ReportType>,
  ) {}

  async getInsightsAsync() {
    const insights: any[] = [];

    const [
      highFailureReports,
      slowReports,
      reportsMissingDetails,
      unusedConnections,
      staleReports,
      failedConnections,
      reportsWithoutTasks,
    ] = await Promise.all([
      this.getHighFailureReportsAsync(),
      this.getSlowestReportsAsync(),
      this.getReportsMissingDetailsAsync(),
      this.getUnusedConnectionsAsync(),
      this.getStaleReportsAsync(),
      this.getFailedConnectionsAsync(),
      this.getReportsWithoutTasksAsync(),
    ]);

    insights.push(...highFailureReports);
    insights.push(...slowReports);
    insights.push(...reportsMissingDetails);
    insights.push(...unusedConnections);
    insights.push(...staleReports);
    insights.push(...failedConnections);
    insights.push(...reportsWithoutTasks);

    return insights.sort((a, b) => b.priority - a.priority);
  }

  private async getHighFailureReportsAsync() {
    const failureExpr = `SUM(CASE WHEN task.status = '${TaskStatus.FAILED}' THEN 1 ELSE 0 END)`;
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.report', 'report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(failureExpr, 'failures')
      .where('report.id IS NOT NULL')
      .groupBy('report.id')
      .addGroupBy('report.name')
      .having(`${failureExpr} > 0`)
      .orderBy(failureExpr, 'DESC')
      .limit(3)
      .getRawMany();

    return result.map((r) => {
      const total = Number(r.total);
      const failures = Number(r.failures);
      const rate = Math.round((failures / total) * 100);
      return {
        id: `failure-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'admin',
        analysisType: 'performance',
        severity: rate > 30 ? 'critical' : rate > 15 ? 'high' : 'medium',
        title: `High Failure Rate Detected for "${r.reportName}"`,
        description: `Report "${r.reportName}" has a ${rate}% failure rate (${failures} failures out of ${total} executions).`,
        whatsMissing: [
          'Error handling mechanisms for database timeouts',
          'Retry logic for transient failures',
          'Monitoring alerts for repeated failures',
        ],
        whatsNeeded: [
          'Robust error handling in report queries',
          'Automated retry with exponential backoff',
          'Real-time failure notifications',
        ],
        requiredActions: [
          'Review query for potential performance bottlenecks',
          'Add timeout handling in query execution',
          'Set up automated retry policies',
        ],
        recommendations: [
          `Optimize the query for "${r.reportName}" to reduce execution time`,
          'Implement circuit breaker for repeated failures',
          'Schedule a review of the report logic',
        ],
        impact: `Could reduce report failure rate by up to 60% and improve overall system reliability`,
        estimatedEffort: rate > 30 ? 'high' : 'medium',
        priority: rate > 30 ? 9 : rate > 15 ? 7 : 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getSlowestReportsAsync() {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.report', 'report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .addSelect('AVG(task.duration)', 'avgDuration')
      .where('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.duration IS NOT NULL')
      .andWhere('report.id IS NOT NULL')
      .groupBy('report.id')
      .addGroupBy('report.name')
      .orderBy('AVG(task.duration)', 'DESC')
      .limit(3)
      .getRawMany();

    return result.map((r) => {
      const avgSecs = Math.round(Number(r.avgDuration));
      const avgDisplay =
        avgSecs > 60 ? `${Math.round(avgSecs / 60)} min` : `${avgSecs} sec`;
      return {
        id: `slow-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'analyst',
        analysisType: 'performance',
        severity: avgSecs > 120 ? 'high' : avgSecs > 60 ? 'medium' : 'low',
        title: `Slow Query Performance: "${r.reportName}"`,
        description: `Report "${r.reportName}" takes an average of ${avgDisplay} to execute, which may impact user experience and system resources.`,
        whatsMissing: [
          'Query optimization for large dataset scans',
          'Indexing strategy for frequently queried columns',
          'Result caching mechanism',
        ],
        whatsNeeded: [
          'Query performance tuning',
          'Database index optimization',
          'Caching layer for repeated queries',
        ],
        requiredActions: [
          'Analyze query execution plan',
          'Add appropriate database indexes',
          'Implement query result caching',
        ],
        recommendations: [
          `Review and optimize the SQL query for "${r.reportName}"`,
          'Consider pagination or incremental loading for large result sets',
          'Schedule heavy reports during off-peak hours',
        ],
        impact: `Optimizing could reduce execution time by 40-60% and improve overall dashboard responsiveness`,
        estimatedEffort: avgSecs > 120 ? 'high' : 'medium',
        priority: avgSecs > 120 ? 8 : avgSecs > 60 ? 6 : 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getReportsMissingDetailsAsync() {
    const result = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .leftJoin('report.reportDetails', 'details')
      .having('COUNT(details.id) = 0')
      .groupBy('report.id')
      .addGroupBy('report.name')
      .limit(3)
      .getRawMany();

    return result.map((r) => ({
      id: `details-${r.reportId}`,
      reportId: r.reportId,
      reportName: r.reportName,
      role: 'manager',
      analysisType: 'data_quality',
      severity: 'medium',
      title: `Missing Field Definitions for "${r.reportName}"`,
      description: `Report "${r.reportName}" has no field/column definitions configured. This may lead to incorrect data mapping and reporting errors.`,
      whatsMissing: [
        'Table and column mappings for the report',
        'Data type definitions for each field',
        'Field validation rules',
      ],
      whatsNeeded: [
        'Complete field configuration in report settings',
        'Data type validation for each column',
        'Automated schema detection',
      ],
      requiredActions: [
        'Configure table and column mappings',
        'Validate data types for each field',
        'Test the report with sample data',
      ],
      recommendations: [
        'Use the schema auto-detection feature to populate fields',
        'Review and verify each field mapping',
        'Add field-level validation rules',
      ],
      impact:
        'Proper field configuration ensures accurate data reporting and prevents data quality issues',
      estimatedEffort: 'medium',
      priority: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private async getUnusedConnectionsAsync() {
    const result = await this.connectionRepository
      .createQueryBuilder('connection')
      .select('connection.name', 'reportName')
      .addSelect('connection.id', 'reportId')
      .leftJoin('connection.reports', 'reports')
      .having('COUNT(reports.id) = 0')
      .groupBy('connection.id')
      .addGroupBy('connection.name')
      .limit(3)
      .getRawMany();

    return result.map((r) => ({
      id: `unused-${r.reportId}`,
      reportId: r.reportId,
      reportName: r.reportName,
      role: 'admin',
      analysisType: 'optimization',
      severity: 'low',
      title: `Unused Connection: "${r.reportName}"`,
      description: `Database connection "${r.reportName}" has no reports associated with it. This may indicate an underutilized or obsolete data source.`,
      whatsMissing: [
        'Reports configured to use this connection',
        'Active queries or scheduled tasks',
        'Documented purpose for the connection',
      ],
      whatsNeeded: [
        'Review if the connection is still needed',
        'Create reports that leverage this data source',
        'Document the connection purpose',
      ],
      requiredActions: [
        'Determine if the connection serves any active purpose',
        'Create reports or archive the connection',
        'Update connection documentation',
      ],
      recommendations: [
        'Consider removing unused connections to reduce complexity',
        'Or create new reports that leverage this data source',
      ],
      impact:
        'Cleaning up unused connections simplifies maintenance and reduces potential security surface area',
      estimatedEffort: 'low',
      priority: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private async getStaleReportsAsync() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.reportRepository.find({
      where: { updatedAt: LessThan(thirtyDaysAgo) },
      order: { updatedAt: 'ASC' },
      take: 3,
    });

    return result.map((r) => ({
      id: `stale-${r.id}`,
      reportId: r.id,
      reportName: r.name,
      role: 'admin',
      analysisType: 'compliance',
      severity: 'medium',
      title: `Stale Report Detected: "${r.name}"`,
      description: `Report "${r.name}" has not been updated in ${Math.round((Date.now() - r.updatedAt.getTime()) / (24 * 60 * 60 * 1000))} days. It may contain outdated information.`,
      whatsMissing: [
        'Recent data refreshes or updates',
        'Review and validation by report owner',
        'Schedule for regular updates',
      ],
      whatsNeeded: [
        'Report content review and update',
        'Automated refresh schedule',
        'Report owner assignment',
      ],
      requiredActions: [
        'Review the report for accuracy and relevance',
        'Update the report with current data',
        'Set up automated refresh schedule if needed',
      ],
      recommendations: [
        'Consider archiving reports that are no longer needed',
        'Set up a regular review cadence for all reports',
        'Assign report owners for accountability',
      ],
      impact:
        'Regular report maintenance ensures decision-makers always have access to current, accurate information',
      estimatedEffort: 'medium',
      priority: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private async getFailedConnectionsAsync() {
    const result = await this.connectionRepository.find({
      where: { isTestSuccessful: false },
      take: 3,
    });

    return result.map((r) => ({
      id: `conn-fail-${r.id}`,
      reportId: r.id,
      reportName: r.name,
      role: 'admin',
      analysisType: 'compliance',
      severity: 'critical',
      title: `Connection Test Failed: "${r.name}"`,
      description: `Database connection "${r.name}" has not passed its connection test. Reports using this connection may fail during execution.`,
      whatsMissing: [
        'Successful connection verification',
        'Updated credentials or server configuration',
        'Network access validation',
      ],
      whatsNeeded: [
        'Connection credentials review and update',
        'Server accessibility verification',
        'Network firewall rules check',
      ],
      requiredActions: [
        'Test the connection to identify the issue',
        'Update connection credentials if expired',
        'Verify network and firewall settings',
      ],
      recommendations: [
        'Immediately test and fix the connection',
        'Set up automated periodic connection testing',
        'Configure alerts for connection failures',
      ],
      impact:
        'Failed connections can cause report execution failures and data gaps in critical reporting',
      estimatedEffort: 'medium',
      priority: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private async getReportsWithoutTasksAsync() {
    const result = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .leftJoin('report.task', 'task')
      .where('task.id IS NULL')
      .limit(3)
      .getRawMany();

    return result.map((r) => ({
      id: `no-task-${r.reportId}`,
      reportId: r.reportId,
      reportName: r.reportName,
      role: 'analyst',
      analysisType: 'optimization',
      severity: 'low',
      title: `Unscheduled Report: "${r.reportName}"`,
      description: `Report "${r.reportName}" has no scheduled task configured. It can only be run manually.`,
      whatsMissing: [
        'Scheduled execution plan',
        'Automated report delivery configuration',
        'Cron expression for regular runs',
      ],
      whatsNeeded: [
        'Review report frequency requirements',
        'Set up scheduled task',
        'Configure email or export delivery',
      ],
      requiredActions: [
        'Determine the required reporting frequency',
        'Create a scheduled task for automated execution',
        'Configure output format and delivery',
      ],
      recommendations: [
        'Set up a daily or weekly schedule based on business needs',
        'Configure email delivery for stakeholders',
        'Add monitoring for schedule adherence',
      ],
      impact:
        'Automating report execution ensures timely delivery and reduces manual effort',
      estimatedEffort: 'low',
      priority: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
}
