import { Response } from 'express';
import { ACCESS_TOKEN_COOKIE_OPTIONS } from '../constants/cookie.config';

export const setAccessTokenCookie = (response: Response, token: string) => {
  response.cookie('access_token', token, ACCESS_TOKEN_COOKIE_OPTIONS);
};

export const clearAccessTokenCookie = (response: Response) => {
  response.clearCookie('access_token', ACCESS_TOKEN_COOKIE_OPTIONS);
};
