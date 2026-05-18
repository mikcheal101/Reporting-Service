import 'reflect-metadata';
import { ScheduleTaskRequestDto } from './schedule-task.request.dto';

describe('ScheduleTaskRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new ScheduleTaskRequestDto();
    dto.generateNow = true;
    dto.reportId = 1;
    expect(dto.generateNow).toBe(true);
    expect(dto.reportId).toBe(1);
  });
});
