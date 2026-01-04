import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QueryParameterDto } from './query-parameter.dto';
import { Type } from 'class-transformer';

export class QueryRequestDto {
  @IsArray()
  computedColumns: any[];

  @IsArray()
  filters: any[];

  @IsBoolean()
  isFromQueryBuilder: boolean;

  @IsArray()
  joins: any[];

  @IsNumber()
  limit: number;

  @ValidateNested({ each: true })
  @Type(() => QueryParameterDto)
  parameters: QueryParameterDto[] = [];

  @IsString()
  queryString: string;

  @IsString()
  reportId: string;
}
