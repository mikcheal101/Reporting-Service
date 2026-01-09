import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ConnectionRequestDto } from './connection.request.dto';

export class UpdateConnectionRequestDto extends ConnectionRequestDto {
  @IsBoolean()
  @IsNotEmpty()
  isTestSuccessful: boolean;
}
