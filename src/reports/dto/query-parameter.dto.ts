import { IsString } from 'class-validator';

export class QueryParameterDto {
  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsString()
  dataType: string;
}
