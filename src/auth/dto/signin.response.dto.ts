export class SignInResponseDto {
  success: boolean;
  message: string;
  errors?: string[];
  timestamp: string;
  requestId?: string;
}
