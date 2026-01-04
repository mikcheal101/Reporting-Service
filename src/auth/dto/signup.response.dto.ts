import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SignUpResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isCreated: boolean;
}
