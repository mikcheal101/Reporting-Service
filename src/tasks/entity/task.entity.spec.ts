import 'reflect-metadata';
import { Task } from './task.entity';
import { Report } from 'src/reports/entity/report.entity';

describe('Task Entity', () => {
  it('should create a task instance', () => {
    const task = new Task();
    task.id = 1;
    task.name = 'Test Task';
    task.cronExpression = '0 8 * * *';
    task.active = true;
    expect(task.name).toBe('Test Task');
    expect(task.cronExpression).toBe('0 8 * * *');
    expect(task.active).toBe(true);
  });

  it('should support report relation', () => {
    const task = new Task();
    const report = new Report();
    report.id = 1;
    task.report = report;
    expect(task.report.id).toBe(1);
  });
});
