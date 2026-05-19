import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Report } from 'src/reports/entity/report.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { TaskStatus } from 'src/tasks/entity/task-status.enum';
import { ReportDetail } from 'src/reports/entity/report-detail.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { AuditLog } from 'src/audit-log/entity/audit-log.entity';

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
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async getInsightsAsync(userId?: number) {
    const insights: any[] = [];

    const [
      highFailureReports,
      slowReports,
      reportsMissingDetails,
      unusedConnections,
      staleReports,
      failedConnections,
      reportsWithoutTasks,
      auditActivity,
    ] = await Promise.all([
      this.getHighFailureReportsAsync(userId),
      this.getSlowestReportsAsync(userId),
      this.getReportsMissingDetailsAsync(userId),
      this.getUnusedConnectionsAsync(userId),
      this.getStaleReportsAsync(userId),
      this.getFailedConnectionsAsync(userId),
      this.getReportsWithoutTasksAsync(userId),
      this.getAuditActivityInsightsAsync(userId),
    ]);

    insights.push(
      ...highFailureReports,
      ...slowReports,
      ...reportsMissingDetails,
      ...unusedConnections,
      ...staleReports,
      ...failedConnections,
      ...reportsWithoutTasks,
      ...auditActivity,
    );

    return insights.sort((a, b) => b.priority - a.priority);
  }

  private async getHighFailureReportsAsync(userId?: number) {
    const failureExpr = `SUM(CASE WHEN task.status = '${TaskStatus.FAILED}' THEN 1 ELSE 0 END)`;
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.report', 'report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(failureExpr, 'failures')
      .addSelect('MAX(task.executedAt)', 'lastFailure')
      .where('report.id IS NOT NULL');

    if (userId) {
      query.andWhere('report.userId = :userId', { userId });
    }

    const result = await query
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
      const lastFailureDate = r.lastFailure
        ? new Date(r.lastFailure).toLocaleDateString()
        : 'unknown';
      return {
        id: `failure-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'admin',
        analysisType: 'performance',
        severity: rate > 30 ? 'critical' : rate > 15 ? 'high' : 'medium',
        title: `${r.reportName} — ${failures} failed of ${total} runs (${rate}%)`,
        description: `Report "${r.reportName}" has a ${rate}% failure rate. Last failure: ${lastFailureDate}.`,
        whatsMissing: [
          `${failures} failed execution(s) out of ${total} total`,
          `Failure rate: ${rate}%`,
          `Last failure recorded: ${lastFailureDate}`,
        ],
        whatsNeeded: [
          `Average ${Math.round(rate / (total || 1))}% failure rate per run`,
          `${total - failures} successful execution(s)`,
        ],
        requiredActions: [
          `Review ${r.reportName} query for errors`,
          `Check connection stability for this report`,
        ],
        recommendations: [
          `Investigate the ${failures} failure(s) in ${r.reportName}`,
          rate > 20
            ? 'Consider adding retry logic with exponential backoff'
            : 'Monitor failure trend for escalation',
        ],
        impact: `${failures} failed runs — ${rate}% of all executions`,
        estimatedEffort: rate > 30 ? 'high' : 'medium',
        priority: rate > 30 ? 9 : rate > 15 ? 7 : 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getSlowestReportsAsync(userId?: number) {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.report', 'report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .addSelect('AVG(task.duration)', 'avgDuration')
      .addSelect('MAX(task.duration)', 'maxDuration')
      .addSelect('MIN(task.duration)', 'minDuration')
      .addSelect('COUNT(*)', 'executionCount')
      .where('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.duration IS NOT NULL')
      .andWhere('report.id IS NOT NULL');

    if (userId) {
      query.andWhere('report.userId = :userId', { userId });
    }

    const result = await query
      .groupBy('report.id')
      .addGroupBy('report.name')
      .orderBy('AVG(task.duration)', 'DESC')
      .limit(3)
      .getRawMany();

    return result.map((r) => {
      const avgSecs = Math.round(Number(r.avgDuration));
      const maxSecs = Math.round(Number(r.maxDuration));
      const minSecs = Math.round(Number(r.minDuration));
      const execCount = Number(r.executionCount);
      const fmt = (s: number) =>
        s > 60 ? `${Math.round(s / 60)} min ${s % 60} sec` : `${s} sec`;
      return {
        id: `slow-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'analyst',
        analysisType: 'performance',
        severity: avgSecs > 120 ? 'high' : avgSecs > 60 ? 'medium' : 'low',
        title: `${r.reportName} — Avg ${fmt(avgSecs)} across ${execCount} runs`,
        description: `Report "${r.reportName}" averages ${fmt(avgSecs)}. Fastest: ${fmt(minSecs)}, Slowest: ${fmt(maxSecs)}.`,
        whatsMissing: [
          `Average duration: ${fmt(avgSecs)}`,
          `Fastest run: ${fmt(minSecs)}`,
          `Slowest run: ${fmt(maxSecs)}`,
        ],
        whatsNeeded: [
          `${execCount} completed execution(s) on record`,
          `Range: ${fmt(minSecs)} – ${fmt(maxSecs)}`,
        ],
        requiredActions: [
          `Review query plan for ${r.reportName}`,
          `Check if indexes exist on queried tables`,
        ],
        recommendations: [
          maxSecs > avgSecs * 2
            ? `High variance detected (${fmt(maxSecs)} max vs ${fmt(avgSecs)} avg) — investigate intermittent slowdowns`
            : `Consider caching if ${r.reportName} runs on a schedule`,
        ],
        impact: `Average ${fmt(avgSecs)} execution time`,
        estimatedEffort: avgSecs > 120 ? 'high' : 'medium',
        priority: avgSecs > 120 ? 8 : avgSecs > 60 ? 6 : 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getReportsMissingDetailsAsync(userId?: number) {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .addSelect('report.createdAt', 'createdAt')
      .leftJoin('report.reportDetails', 'details');

    if (userId) {
      query.where('report.userId = :userId', { userId });
    }

    const result = await query
      .groupBy('report.id')
      .addGroupBy('report.name')
      .addGroupBy('report.createdAt')
      .having('COUNT(details.id) = 0')
      .limit(3)
      .getRawMany();

    return result.map((r) => {
      const createdDate = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
        : 'unknown';
      return {
        id: `details-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'manager',
        analysisType: 'data_quality',
        severity: 'medium',
        title: `${r.reportName} — No field definitions configured`,
        description: `Report "${r.reportName}" (created ${createdDate}) has no field/column definitions. It cannot produce accurate results until fields are mapped.`,
        whatsMissing: [
          `0 field definitions configured for "${r.reportName}"`,
          `Report created: ${createdDate}`,
        ],
        whatsNeeded: [
          `Table and column mappings need to be set up`,
          `Data types must be defined for each output field`,
        ],
        requiredActions: [
          `Open "${r.reportName}" and configure field mappings`,
          `Validate that the query schema matches defined fields`,
        ],
        recommendations: [
          `Use auto-detect schema to populate fields from query result`,
          `Review field data types before running the report`,
        ],
        impact: `Cannot generate accurate output without field definitions`,
        estimatedEffort: 'medium',
        priority: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getUnusedConnectionsAsync(userId?: number) {
    const query = this.connectionRepository
      .createQueryBuilder('connection')
      .select('connection.name', 'reportName')
      .addSelect('connection.id', 'reportId')
      .addSelect('connection.databaseType', 'databaseType')
      .addSelect('connection.createdAt', 'createdAt')
      .leftJoin('connection.reports', 'reports');

    if (userId) {
      query.where('connection.userId = :userId', { userId });
    }

    const result = await query
      .groupBy('connection.id')
      .addGroupBy('connection.name')
      .addGroupBy('connection.databaseType')
      .addGroupBy('connection.createdAt')
      .having('COUNT(reports.id) = 0')
      .limit(3)
      .getRawMany();

    return result.map((r) => {
      const createdDate = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
        : 'unknown';
      const dbType =
        r.databaseType !== null && r.databaseType !== undefined
          ? typeof r.databaseType === 'string'
            ? r.databaseType
            : ['MSSQL', 'MySQL', 'Oracle', 'PostgreSQL', 'MariaDB', 'IBMDb2', 'Firebird', 'H2Database'][Number(r.databaseType)] || 'Unknown'
          : 'Unknown';
      return {
        id: `unused-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'admin',
        analysisType: 'optimization',
        severity: 'low',
        title: `${r.reportName} (${dbType}) — No reports using it`,
        description: `Connection "${r.reportName}" (${dbType}, created ${createdDate}) has zero associated reports.`,
        whatsMissing: [
          `0 reports linked to "${r.reportName}"`,
          `Database type: ${dbType}`,
          `Created: ${createdDate}`,
        ],
        whatsNeeded: [
          `No active queries or schedules using this connection`,
        ],
        requiredActions: [
          `Decide whether to create reports for "${r.reportName}" or remove it`,
        ],
        recommendations: [
          `If obsolete, delete the connection to reduce maintenance overhead`,
          `If needed, create at least one report to validate connectivity`,
        ],
        impact: `Potential orphaned resource — no reports depend on it`,
        estimatedEffort: 'low',
        priority: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getStaleReportsAsync(userId?: number) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const where: any = { updatedAt: LessThan(thirtyDaysAgo) };
    if (userId) {
      where.userId = userId;
    }
    const result = await this.reportRepository.find({
      where,
      order: { updatedAt: 'ASC' },
      take: 3,
    });

    return result.map((r) => {
      const daysSinceUpdate = Math.round(
        (Date.now() - r.updatedAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      const createdDate = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
        : 'unknown';
      const updatedDate = r.updatedAt
        ? new Date(r.updatedAt).toLocaleDateString()
        : 'unknown';
      return {
        id: `stale-${r.id}`,
        reportId: r.id,
        reportName: r.name,
        role: 'admin',
        analysisType: 'compliance',
        severity: daysSinceUpdate > 90 ? 'high' : daysSinceUpdate > 60 ? 'medium' : 'low',
        title: `${r.name} — ${daysSinceUpdate} days since last update`,
        description: `Report "${r.name}" was last updated ${updatedDate} (${daysSinceUpdate} days ago). Created ${createdDate}.`,
        whatsMissing: [
          `Last updated: ${updatedDate} (${daysSinceUpdate} days ago)`,
          `Created: ${createdDate}`,
        ],
        whatsNeeded: [
          daysSinceUpdate > 90
            ? `Report may contain outdated data — review recommended`
            : `Schedule a periodic review for this report`,
        ],
        requiredActions: [
          `Review "${r.name}" for accuracy and relevance`,
          daysSinceUpdate > 90
            ? `Consider archiving if no longer needed`
            : `Update the report with current data`,
        ],
        recommendations: [
          daysSinceUpdate > 90
            ? `Archive "${r.name}" if it is no longer relevant`
            : `Set up automated refresh schedule`,
        ],
        impact: `${daysSinceUpdate} days since last modification`,
        estimatedEffort: daysSinceUpdate > 90 ? 'medium' : 'low',
        priority: daysSinceUpdate > 90 ? 7 : daysSinceUpdate > 60 ? 5 : 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getFailedConnectionsAsync(userId?: number) {
    const where: any = { isTestSuccessful: false };
    if (userId) {
      where.userId = userId;
    }
    const result = await this.connectionRepository.find({
      where,
      take: 3,
    });

    return result.map((r) => {
      const dbType =
        r.databaseType !== null && r.databaseType !== undefined
          ? typeof r.databaseType === 'string'
            ? r.databaseType
            : ['MSSQL', 'MySQL', 'Oracle', 'PostgreSQL', 'MariaDB', 'IBMDb2', 'Firebird', 'H2Database'][Number(r.databaseType)] || 'Unknown'
          : 'Unknown';
      return {
        id: `conn-fail-${r.id}`,
        reportId: r.id,
        reportName: r.name,
        role: 'admin',
        analysisType: 'compliance',
        severity: 'critical',
        title: `${r.name} (${dbType}) — Connection test failing`,
        description: `Database connection "${r.name}" (${dbType}) has not passed its connection test. Reports using this connection will fail.`,
        whatsMissing: [
          `Connection: "${r.name}" (${dbType})`,
          `Server: ${r.server}:${r.port}`,
          `Database: ${r.database}`,
        ],
        whatsNeeded: [
          `Connection test has not passed`,
          `Check if credentials are still valid`,
        ],
        requiredActions: [
          `Test connection "${r.name}" to identify the issue`,
          `Update credentials if expired`,
          `Verify ${r.server}:${r.port} is reachable`,
        ],
        recommendations: [
          `Update connection credentials and re-test`,
          `Verify network/firewall allows outbound access to ${r.server}:${r.port}`,
        ],
        impact: `Reports using "${r.name}" will fail until connection is restored`,
        estimatedEffort: 'medium',
        priority: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getReportsWithoutTasksAsync(userId?: number) {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .select('report.name', 'reportName')
      .addSelect('report.id', 'reportId')
      .addSelect('report.createdAt', 'createdAt')
      .leftJoin('report.task', 'task')
      .where('task.id IS NULL');

    if (userId) {
      query.andWhere('report.userId = :userId', { userId });
    }

    const result = await query
      .limit(3)
      .getRawMany();

    return result.map((r) => {
      const createdDate = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
        : 'unknown';
      return {
        id: `no-task-${r.reportId}`,
        reportId: r.reportId,
        reportName: r.reportName,
        role: 'analyst',
        analysisType: 'optimization',
        severity: 'low',
        title: `${r.reportName} — No scheduled task (created ${createdDate})`,
        description: `Report "${r.reportName}" (created ${createdDate}) has no scheduled task. It can only be run manually.`,
        whatsMissing: [
          `No scheduled task configured`,
          `Created: ${createdDate}`,
        ],
        whatsNeeded: [
          `Report will not run automatically`,
          `Must be executed manually each time`,
        ],
        requiredActions: [
          `Create a scheduled task for "${r.reportName}" if it needs regular execution`,
        ],
        recommendations: [
          `Set up a schedule based on how frequently this report's data changes`,
          `Configure email delivery if stakeholders need automatic distribution`,
        ],
        impact: `Manual execution only — no automation configured`,
        estimatedEffort: 'low',
        priority: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private async getAuditActivityInsightsAsync(userId?: number) {
    const insights: any[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = { createdAt: MoreThan(thirtyDaysAgo) };
    if (userId) {
      where.userId = userId;
    }

    const actionBreakdown = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere(userId ? 'log.userId = :userId' : '1=1', userId ? { userId } : {})
      .groupBy('log.action')
      .getRawMany();

    const entityBreakdown = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.entity', 'entity')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere(userId ? 'log.userId = :userId' : '1=1', userId ? { userId } : {})
      .groupBy('log.entity')
      .orderBy('COUNT(*)', 'DESC')
      .limit(3)
      .getRawMany();

    const totalActions = actionBreakdown.reduce(
      (sum, r) => sum + Number(r.count),
      0,
    );

    if (totalActions === 0) return insights;

    const actionSummary = actionBreakdown
      .map((r) => `${r.count} ${r.action}`)
      .join(', ');

    const entitySummary = entityBreakdown
      .map((r) => `"${r.entity}" (${r.count})`)
      .join(', ');

    const deleteCount =
      Number(
        actionBreakdown.find((r) => r.action === 'DELETE')?.count || 0,
      );

    if (deleteCount > 0) {
      insights.push({
        id: `audit-deletes-${Date.now()}`,
        reportId: null,
        reportName: 'System',
        role: 'admin',
        analysisType: 'compliance',
        severity: deleteCount > 5 ? 'high' : 'medium',
        title: `${deleteCount} deletion(s) in the last 30 days`,
        description: `${deleteCount} DELETE operation(s) were recorded. Total actions: ${totalActions}. Top entities: ${entitySummary}.`,
        whatsMissing: [
          `${deleteCount} DELETE(s) out of ${totalActions} total actions`,
          `Actions breakdown: ${actionSummary}`,
        ],
        whatsNeeded: [
          `Most active entities: ${entitySummary}`,
        ],
        requiredActions: [
          deleteCount > 5
            ? `Review the ${deleteCount} deletions for unauthorized activity`
            : `Verify the ${deleteCount} deletion(s) were authorized`,
        ],
        recommendations: [
          `Review audit log for unexpected DELETE patterns`,
        ],
        impact: `${deleteCount} records deleted in the past 30 days`,
        estimatedEffort: 'medium',
        priority: deleteCount > 5 ? 8 : 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (totalActions > 0 && !deleteCount) {
      insights.push({
        id: `audit-summary-${Date.now()}`,
        reportId: null,
        reportName: 'System',
        role: 'viewer',
        analysisType: 'compliance',
        severity: 'low',
        title: `${totalActions} system action(s) logged — no deletions`,
        description: `${totalActions} action(s) in the last 30 days. Breakdown: ${actionSummary}. Top entities: ${entitySummary}.`,
        whatsMissing: [
          `Total actions: ${totalActions}`,
          `Actions: ${actionSummary}`,
        ],
        whatsNeeded: [
          `Most active entities: ${entitySummary}`,
        ],
        requiredActions: [],
        recommendations: [
          `No unusual activity detected — audit trail is healthy`,
        ],
        impact: `Clean audit log with ${totalActions} action(s)`,
        estimatedEffort: 'low',
        priority: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return insights;
  }
}
