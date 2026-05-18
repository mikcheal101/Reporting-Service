import { Response } from 'express';
import { ACCESS_TOKEN_COOKIE_OPTIONS } from '../constants/cookie.config';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../common/constants/cookie.constant';

export const setAccessTokenCookie = (response: Response, token: string) => {
  response.cookie(ACCESS_TOKEN_COOKIE_NAME, token, ACCESS_TOKEN_COOKIE_OPTIONS);
};

export const clearAccessTokenCookie = (response: Response) => {
  response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_OPTIONS);
};
