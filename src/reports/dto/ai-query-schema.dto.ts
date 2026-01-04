import { IsString } from 'class-validator';

export class AiQuerySchemaDto {
  @IsString()
  table: string;

  @IsString()
  columns: string;
}
