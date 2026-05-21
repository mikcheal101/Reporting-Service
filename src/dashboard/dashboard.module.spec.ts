import { Test, TestingModule } from '@nestjs/testing';
import { DashboardModule } from './dashboard.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report } from 'src/reports/entity/report.entity';
import { ReportDetail } from 'src/reports/entity/report-detail.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { User } from 'src/users/entity/users.entity';
import { AuditLog } from 'src/audit-log/entity/audit-log.entity';
import { AuthGuard } from 'src/auth/guard/auth.guard';

describe('DashboardModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DashboardModule],
    })
      .overrideProvider(getRepositoryToken(Report))
      .useValue({})
      .overrideProvider(getRepositoryToken(ReportDetail))
      .useValue({})
      .overrideProvider(getRepositoryToken(Task))
      .useValue({})
      .overrideProvider(getRepositoryToken(ReportType))
      .useValue({})
      .overrideProvider(getRepositoryToken(Connection))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuditLog))
      .useValue({})
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    expect(module).toBeDefined();
    expect(module.get(DashboardController)).toBeInstanceOf(DashboardController);
    expect(module.get(DashboardService)).toBeInstanceOf(DashboardService);
    expect(module.get(DashboardAiService)).toBeInstanceOf(DashboardAiService);
  });
});
