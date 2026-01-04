import { SignInResponseData } from './signin.response.data.dto';

export class SignInResponseDto {
  success: boolean;
  message: string;
  errors: string[];
  timestamp: string;
  requestId: string;
  data: SignInResponseData;
}
