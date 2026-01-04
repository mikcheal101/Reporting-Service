import { IsArray, IsString } from 'class-validator';
import { AiQuerySchemaDto } from './ai-query-schema.dto';

export class AiQueryGenerationRequestDto {
  @IsString()
  reportId: string;

  @IsString()
  prompt: string;

  @IsArray()
  schemas: AiQuerySchemaDto[];
}
