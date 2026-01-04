import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateConnectionResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isUpdated: boolean;
}
