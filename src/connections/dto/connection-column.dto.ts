import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectionColumnDto {
  @IsString()
  @IsNotEmpty()
  columnName: string;

  @IsString()
  @IsNotEmpty()
  dataType: string;
}
