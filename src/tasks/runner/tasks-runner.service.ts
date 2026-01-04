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

  private async exportReport(
    task: Task,
    databaseResponse: any,
  ): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
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
  }

  private async sendReportEmail(
    task: Task,
    filename: string,
    buffer: Buffer,
  ): Promise<boolean> {
    return await this.mailService.send(
      task.report.reportType.emails
        .split(',')
        .map((email: string) => email.trim()),
      `${task.report.name} Report`,
      { filename, buffer },
    );
  }

  private async updateTaskStatus(
    taskId: number,
    mailSent: boolean,
  ): Promise<void> {
    const newStatus: TaskStatus =
      mailSent === true ? TaskStatus.COMPLETED : TaskStatus.FAILED;
    await this.tasksStatusService.updateStatus(taskId, newStatus, [
      TaskStatus.RUNNING,
    ]);
  }

  public async executeTask(task: Task): Promise<void> {
    try {
      this.validateTask(task);

      const dbResponse = await this.runReport(task);

      const { buffer, filename } = await this.exportReport(task, dbResponse);

      const mediaDirectory: string = join(__dirname, '..', '..', 'media');
      await mkdir(mediaDirectory, { recursive: true });

      const filePath: string = join(mediaDirectory, filename);
      await writeFile(filePath, buffer);

      const mailSent = await this.sendReportEmail(task, filename, buffer);

      await this.updateTaskStatus(task.id, mailSent);
    } catch (error) {
      this.logger.error(error.message);
      await this.tasksStatusService.updateStatus(task.id, TaskStatus.FAILED, [
        TaskStatus.QUEUED,
        TaskStatus.RUNNING,
      ]);
    }
  }

  private createAdapter(connection: Connection): IDatabaseAdapter {
    return DatabaseFactory.create({
      name: connection.name,
      database: connection.database,
      databaseType: connection.databaseType,
      password: this.cryptoService.decrypt(connection.password),
      port: `${connection.port}`,
      server: connection.server,
      user: connection.user,
    });
  }

  private async runReport(task: Task) {
    await this.tasksStatusService.updateStatus(task.id, TaskStatus.RUNNING, [
      TaskStatus.QUEUED,
    ]);

    // run the query tied to the report
    const adapter: IDatabaseAdapter = this.createAdapter(
      task.report.connection,
    );

    // convert the result into the format that is expected.
    const parameters = this.databaseUtils.mapDbParameters(
      task.report.parameters,
    );
    await adapter.connect();
    const dbResponse = await adapter.query(task.report.queryString, parameters);
    return dbResponse;
  }
}
