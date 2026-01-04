import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ConnectionRequestDto } from './connection.request.dto';

export class CreateConnectionRequestDto extends ConnectionRequestDto {
  @IsBoolean()
  @IsNotEmpty()
  isTestSuccessful: boolean;
}
