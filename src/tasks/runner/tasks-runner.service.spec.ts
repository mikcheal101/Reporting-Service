import { Test, TestingModule } from '@nestjs/testing';
import { TasksRunnerService } from './tasks-runner.service';
import { TasksStatusService } from '../status/tasks-status.service';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { DatabaseUtils } from 'src/common/utils/database.utils';
import { MailService } from 'src/mail/mail.service';
import { Task } from '../entity/task.entity';
import { TaskStatus } from '../entity/task-status.enum';
import { Report } from 'src/reports/entity/report.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { DatabaseType } from 'src/connections/databasetype.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';
import { DatabaseFactory } from 'src/connections/database.factory';
import { ExporterFactory } from 'src/common/exporters/exporter.factory';
import { FileFormatFactory } from 'src/common/utils/file-format.factory';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('node:path', () => ({
  join: jest.fn().mockReturnValue('/mock/path/file'),
}));

describe('TasksRunnerService', () => {
  let service: TasksRunnerService;
  let tasksStatusService: TasksStatusService;
  let cryptoService: CryptoService;
  let databaseUtils: DatabaseUtils;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksRunnerService,
        {
          provide: TasksStatusService,
          useValue: {
            updateStatusAsync: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            decrypt: jest.fn().mockReturnValue('decrypted-password'),
          },
        },
        {
          provide: DatabaseUtils,
          useValue: {
            mapDbParameters: jest.fn().mockReturnValue({}),
          },
        },
        {
          provide: MailService,
          useValue: {
            send: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<TasksRunnerService>(TasksRunnerService);
    tasksStatusService = module.get<TasksStatusService>(TasksStatusService);
    cryptoService = module.get<CryptoService>(CryptoService);
    databaseUtils = module.get<DatabaseUtils>(DatabaseUtils);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  const createMockTask = (overrides: Partial<Task> = {}): Task => {
    const connection = new Connection();
    Object.assign(connection, {
      id: 1,
      name: 'test-conn',
      database: 'testdb',
      databaseType: DatabaseType.MSSQL,
      password: 'encrypted-pass',
      port: 1433,
      server: 'localhost',
      user: 'sa',
    });

    const reportType = new ReportType();
    Object.assign(reportType, {
      id: 1,
      name: 'daily-report',
      outputType: OutputFormat.CSV,
      emails: 'admin@test.com',
    });

    const report = new Report();
    Object.assign(report, {
      id: 1,
      name: 'Test Report',
      queryString: 'SELECT * FROM users',
      connection,
      reportType,
      parameters: [],
    });

    const task = new Task();
    Object.assign(task, {
      id: 1,
      name: 'Test Task',
      report,
      cronExpression: '0 0 * * *',
      active: true,
      status: TaskStatus.QUEUED,
      ...overrides,
    });
    return task;
  };

  const mockAdapter = {
    connectAsync: jest.fn().mockResolvedValue(true),
    queryAsync: jest.fn().mockResolvedValue([{ id: 1, name: 'John' }]),
    closeAsync: jest.fn().mockResolvedValue(true),
  };

  describe('executeTaskAsync', () => {
    it('should execute a task successfully', async () => {
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);
      jest.spyOn(ExporterFactory, 'create').mockReturnValue({
        export: jest.fn().mockResolvedValue(Buffer.from('data')),
      } as any);
      jest.spyOn(FileFormatFactory, 'create').mockReturnValue('.csv');

      const task = createMockTask();
      await service.executeTaskAsync(task);

      expect(DatabaseFactory.create).toHaveBeenCalledWith({
        name: 'test-conn',
        database: 'testdb',
        databaseType: DatabaseType.MSSQL,
        password: 'decrypted-password',
        port: 1433,
        server: 'localhost',
        user: 'sa',
      });
      expect(cryptoService.decrypt).toHaveBeenCalledWith('encrypted-pass');
      expect(databaseUtils.mapDbParameters).toHaveBeenCalledWith([]);
      expect(mockAdapter.connectAsync).toHaveBeenCalled();
      expect(mockAdapter.queryAsync).toHaveBeenCalled();
      expect(mailService.send).toHaveBeenCalled();
      expect(tasksStatusService.updateStatusAsync).toHaveBeenCalledWith(
        task.id,
        TaskStatus.RUNNING,
        [TaskStatus.QUEUED],
      );
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
    });

    it('should catch error and set status to FAILED', async () => {
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);
      jest.spyOn(ExporterFactory, 'create').mockReturnValue({
        export: jest.fn().mockRejectedValue(new Error('Export failed')),
      } as any);
      jest.spyOn(FileFormatFactory, 'create').mockReturnValue('.csv');

      const task = createMockTask();
      await service.executeTaskAsync(task);

      expect(tasksStatusService.updateStatusAsync).toHaveBeenCalledWith(
        task.id,
        TaskStatus.FAILED,
        [TaskStatus.QUEUED, TaskStatus.RUNNING],
      );
    });

    it('should set status to FAILED when mail send fails', async () => {
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);
      jest.spyOn(ExporterFactory, 'create').mockReturnValue({
        export: jest.fn().mockResolvedValue(Buffer.from('data')),
      } as any);
      jest.spyOn(FileFormatFactory, 'create').mockReturnValue('.csv');
      jest.spyOn(mailService, 'send').mockResolvedValue(false);

      const task = createMockTask();
      await service.executeTaskAsync(task);

      expect(tasksStatusService.updateStatusAsync).toHaveBeenLastCalledWith(
        task.id,
        TaskStatus.FAILED,
        [TaskStatus.RUNNING],
      );
    });

    it('should validate task and throw if no report', async () => {
      const task = createMockTask({ report: null });

      await service.executeTaskAsync(task);

      expect(tasksStatusService.updateStatusAsync).toHaveBeenCalledWith(
        task.id,
        TaskStatus.FAILED,
        [TaskStatus.QUEUED, TaskStatus.RUNNING],
      );
    });

    it('should validate task and throw if no connection on report', async () => {
      const report = Object.assign(new Report(), { id: 1 });
      const task = createMockTask({ report });

      await service.executeTaskAsync(task);

      expect(tasksStatusService.updateStatusAsync).toHaveBeenCalledWith(
        task.id,
        TaskStatus.FAILED,
        [TaskStatus.QUEUED, TaskStatus.RUNNING],
      );
    });

    it('should use FileFormatFactory for correct extension', async () => {
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);
      jest.spyOn(ExporterFactory, 'create').mockReturnValue({
        export: jest.fn().mockResolvedValue(Buffer.from('data')),
      } as any);
      const fileFormatSpy = jest
        .spyOn(FileFormatFactory, 'create')
        .mockReturnValue('.csv');

      const task = createMockTask();
      await service.executeTaskAsync(task);

      expect(fileFormatSpy).toHaveBeenCalledWith(OutputFormat.CSV);
    });

    it('should generate filename from report name', async () => {
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);
      jest.spyOn(ExporterFactory, 'create').mockReturnValue({
        export: jest.fn().mockResolvedValue(Buffer.from('data')),
      } as any);
      jest.spyOn(FileFormatFactory, 'create').mockReturnValue('.csv');

      const task = createMockTask();
      await service.executeTaskAsync(task);

      expect(join).toHaveBeenCalled();
    });
  });
});
