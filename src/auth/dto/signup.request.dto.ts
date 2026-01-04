import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SignUpRequestDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  middleName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}
