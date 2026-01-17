import { Injectable, Logger } from '@nestjs/common';
import { TaskStatus } from '../entity/task-status.enum';
import { Task } from '../entity/task.entity';
import { TasksStatusService } from '../status/tasks-status.service';
import { IDatabaseAdapter } from 'src/connections/adapter/idatabase.adapter';
import { DatabaseFactory } from 'src/connections/database.factory';
import { Connection } from 'src/connections/entity/connections.entity';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { DatabaseUtils } from 'src/common/utils/database.utils';
import { ExporterFactory } from 'src/common/exporters/exporter.factory';
import { IReportExporter } from 'src/common/exporters/ireport-exporter';
import { MailService } from 'src/mail/mail.service';
import { FileFormatFactory } from 'src/common/utils/file-format.factory';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

@Injectable()
export class TasksRunnerService {
  private readonly logger: Logger;

  constructor(
    private readonly tasksStatusService: TasksStatusService,
    private readonly cryptoService: CryptoService,
    private readonly databaseUtils: DatabaseUtils,
    private readonly mailService: MailService,
  ) {
    this.logger = new Logger(TasksRunnerService.name);
  }

  private validateTask(task: Task) {
    this.logger.log(`validating task: ${task.id}`);
    if (!task.report) {
      throw new Error(`Task with id: ${task.id} has no report attached.`);
    }

    if (!task.report.connection) {
      throw new Error(
        `No Connection tied to the Task: ${task.id}, report: ${task.report.id}`,
      );
    }
  }

  private readonly exportReportAsync = async (
    task: Task,
    databaseResponse: any,
  ): Promise<{
    buffer: Buffer;
    filename: string;
  }> => {
    const exporter: IReportExporter = ExporterFactory.create(
      task.report.reportType.outputType,
    );

    const buffer: Buffer = await exporter.export(databaseResponse);

    // Fetch the emails and send them with the attachments in the format requested
    const fileExtension: string = FileFormatFactory.create(
      task.report.reportType.outputType,
    );
    const filename: string = `${task.report.name.replaceAll(' ', '_')}${fileExtension}`;

    return { buffer, filename };
  };

  private readonly sendReportEmailAsync = async (
    task: Task,
    filename: string,
    buffer: Buffer,
  ): Promise<boolean> => {
    return await this.mailService.send(
      task.report.reportType.emails
        .split(',')
        .map((email: string) => email.trim()),
      `${task.report.name} Report`,
      { filename, buffer },
    );
  };

  private readonly updateTaskStatusAsync = async (
    taskId: number,
    mailSent: boolean,
  ): Promise<void> => {
    const newStatus: TaskStatus =
      mailSent === true ? TaskStatus.COMPLETED : TaskStatus.FAILED;
    await this.tasksStatusService.updateStatusAsync(taskId, newStatus, [
      TaskStatus.RUNNING,
    ]);
  };

  public executeTaskAsync = async (task: Task): Promise<void> => {
    try {
      this.validateTask(task);

      const dbResponse = await this.runReportAsync(task);

      const { buffer, filename } = await this.exportReportAsync(
        task,
        dbResponse,
      );

      const mediaDirectory: string = join(__dirname, '..', '..', 'media');
      await mkdir(mediaDirectory, { recursive: true });

      const filePath: string = join(mediaDirectory, filename);
      await writeFile(filePath, buffer);

      const mailSent = await this.sendReportEmailAsync(task, filename, buffer);

      await this.updateTaskStatusAsync(task.id, mailSent);
    } catch (error) {
      this.logger.error(error.message);
      await this.tasksStatusService.updateStatusAsync(
        task.id,
        TaskStatus.FAILED,
        [TaskStatus.QUEUED, TaskStatus.RUNNING],
      );
    }
  };

  private readonly createAdapter = (
    connection: Connection,
  ): IDatabaseAdapter => {
    return DatabaseFactory.create({
      name: connection.name,
      database: connection.database,
      databaseType: connection.databaseType,
      password: this.cryptoService.decrypt(connection.password),
      port: connection.port,
      server: connection.server,
      user: connection.user,
    });
  };

  private readonly runReportAsync = async (task: Task) => {
    await this.tasksStatusService.updateStatusAsync(
      task.id,
      TaskStatus.RUNNING,
      [TaskStatus.QUEUED],
    );

    // run the query tied to the report
    const adapter: IDatabaseAdapter = this.createAdapter(
      task.report.connection,
    );

    // convert the result into the format that is expected.
    const parameters = this.databaseUtils.mapDbParameters(
      task.report.parameters,
    );
    await adapter.connectAsync();
    const dbResponse = await adapter.queryAsync(
      task.report.queryString,
      parameters,
      3 * 60 * 60 * 1000, // 3 hours
    );
    return dbResponse;
  };
}
