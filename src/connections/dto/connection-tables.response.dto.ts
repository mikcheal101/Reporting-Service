import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ConnectionColumnDto } from './connection-column.dto';
import { Type } from 'class-transformer';

export class ConnectionTablesResponseDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsArray()
  @Type(() => ConnectionColumnDto)
  @ValidateNested({ each: true })
  columns: ConnectionColumnDto[];
}
