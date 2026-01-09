// connections/dto/connection-column.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectionColumnDto {
  @IsString()
  @IsNotEmpty()
  columnName: string;

  @IsString()
  @IsNotEmpty()
  dataType: string;
}
