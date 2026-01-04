import { IsBoolean, IsNumber } from 'class-validator';

export class ScheduleTaskRequestDto {
  @IsBoolean()
  generateNow: boolean;

  @IsNumber()
  reportId: number;
}
