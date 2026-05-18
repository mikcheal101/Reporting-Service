import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Report } from 'src/reports/entity/report.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { TaskStatus } from 'src/tasks/entity/task-status.enum';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { User } from 'src/users/entity/users.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ReportType)
    private readonly reportTypeRepository: Repository<ReportType>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMetricsAsync() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalReports,
      reportsThisMonth,
      reportsLastMonth,
      totalConnections,
      totalUsers,
      totalReportTypes,
      tasksByStatus,
      reportsByTypeRaw,
      lastTask,
      avgDuration,
      executionTrendsRaw,
      topReportsRaw,
      dailyErrorRatesRaw,
    ] = await Promise.all([
      this.reportRepository.count(),
      this.reportRepository.count({
        where: { createdAt: Between(firstOfMonth, now) },
      }),
      this.reportRepository.count({
        where: { createdAt: Between(startOfLastMonth, endOfLastMonth) },
      }),
      this.connectionRepository.count(),
      this.userRepository.count(),
      this.reportTypeRepository.count(),
      this.taskRepository
        .createQueryBuilder('task')
        .select('task.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.status')
        .getRawMany(),
      this.reportTypeRepository
        .createQueryBuilder('rt')
        .leftJoin('rt.reports', 'r')
        .select('rt.name', 'type')
        .addSelect('COUNT(r.id)', 'count')
        .groupBy('rt.id')
        .addGroupBy('rt.name')
        .getRawMany(),
      this.taskRepository.findOne({
        where: {
          status: TaskStatus.COMPLETED,
          executedAt: MoreThan(new Date(0)),
        },
        order: { executedAt: 'DESC' },
        relations: ['report'],
      }),
      this.taskRepository
        .createQueryBuilder('task')
        .select('AVG(task.duration)', 'avg')
        .where('task.status = :status', { status: TaskStatus.COMPLETED })
        .andWhere('task.duration IS NOT NULL')
        .getRawOne(),
      this.taskRepository
        .createQueryBuilder('task')
        .select('CAST(task.executedAt AS DATE)', 'date')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(AVG(task.duration), 0)', 'avgTime')
        .where('task.executedAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .andWhere('task.status IN (:...statuses)', {
          statuses: [TaskStatus.COMPLETED, TaskStatus.FAILED],
        })
        .groupBy('CAST(task.executedAt AS DATE)')
        .orderBy('CAST(task.executedAt AS DATE)', 'ASC')
        .getRawMany(),
      this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.report', 'report')
        .select('report.name', 'name')
        .addSelect('COUNT(*)', 'executions')
        .addSelect('COALESCE(AVG(task.duration), 0)', 'avgTime')
        .where('task.status = :status', { status: TaskStatus.COMPLETED })
        .andWhere('task.duration IS NOT NULL')
        .groupBy('report.name')
        .orderBy('COUNT(*)', 'DESC')
        .limit(5)
        .getRawMany(),
      this.taskRepository
        .createQueryBuilder('task')
        .select('CAST(task.executedAt AS DATE)', 'date')
        .addSelect(
          `SUM(CASE WHEN task.status = '${TaskStatus.FAILED}' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) * 100`,
          'errorRate',
        )
        .where('task.executedAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .andWhere('task.status IN (:...statuses)', {
          statuses: [TaskStatus.COMPLETED, TaskStatus.FAILED],
        })
        .groupBy('CAST(task.executedAt AS DATE)')
        .orderBy('CAST(task.executedAt AS DATE)', 'ASC')
        .getRawMany(),
    ]);

    const completedTasks = this.getStatusCount(
      tasksByStatus,
      TaskStatus.COMPLETED,
    );
    const failedTasks = this.getStatusCount(tasksByStatus, TaskStatus.FAILED);
    const runningTasks = this.getStatusCount(tasksByStatus, TaskStatus.RUNNING);
    const pendingTasks =
      this.getStatusCount(tasksByStatus, TaskStatus.QUEUED) +
      this.getStatusCount(tasksByStatus, TaskStatus.SCHEDULED) +
      this.getStatusCount(tasksByStatus, TaskStatus.RETRYING);

    const totalTasks =
      completedTasks + failedTasks + runningTasks + pendingTasks;
    const successRate =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10
        : 0;

    const avgDurationSecs = avgDuration?.avg
      ? Math.round(Number(avgDuration.avg) * 10) / 10
      : 0;
    const avgDurationFormatted =
      avgDurationSecs > 0
        ? `${avgDurationSecs < 60 ? avgDurationSecs + ' sec' : Math.round((avgDurationSecs / 60) * 10) / 10 + ' min'}`
        : '0 sec';

    const reportsByType = reportsByTypeRaw.map((r) => ({
      type: r.type,
      count: Number(r.count),
      percentage:
        totalReports > 0
          ? Math.round((Number(r.count) / totalReports) * 100)
          : 0,
    }));

    const reportsByStatus = [
      { status: 'Completed', count: completedTasks, color: '#10B981' },
      { status: 'Pending', count: pendingTasks, color: '#F59E0B' },
      { status: 'Failed', count: failedTasks, color: '#EF4444' },
      { status: 'Running', count: runningTasks, color: '#3B82F6' },
    ];

    const executionTrends = executionTrendsRaw.map((r) => ({
      date: r.date,
      count: Number(r.count),
      avgTime: Math.round(Number(r.avgTime) * 10) / 10,
    }));

    const topPerformingReports = topReportsRaw.map((r) => ({
      name: r.name,
      executions: Number(r.executions),
      avgTime: `${Math.round(Number(r.avgTime) * 10) / 10} sec`,
    }));

    const errorRates = dailyErrorRatesRaw.map((r) => ({
      date: r.date,
      errorRate: Math.round(Number(r.errorRate) * 10) / 10,
    }));

    return {
      reportStats: {
        totalReports: totalReports || 0,
        reportsThisMonth: reportsThisMonth || 0,
        reportsLastMonth: reportsLastMonth || 0,
        activeReports: runningTasks || 0,
        completedReports: completedTasks || 0,
        pendingReports: pendingTasks || 0,
        failedReports: failedTasks || 0,
        averageGenerationTime: avgDurationSecs,
        averageExecutionTime: avgDurationFormatted,
        successRate: successRate || 100,
        lastGenerated: lastTask?.executedAt?.toISOString() || null,
      },
      reportsByType,
      reportsByStatus,
      executionTrends,
      topPerformingReports,
      errorRates,
      connectionCount: totalConnections || 0,
      userCount: totalUsers || 0,
      reportTypeCount: totalReportTypes || 0,
    };
  }

  private getStatusCount(rows: any[], status: TaskStatus): number {
    const row = rows.find((r) => r.status === status);
    return row ? Number(row.count) : 0;
  }
}
