import { SetMetadata } from '@nestjs/common';

export const API_RESPONSE_MESSAGE_KEY = 'response_message';
export const ApiResponseMessage = (message: string) =>
  SetMetadata(API_RESPONSE_MESSAGE_KEY, message);
