import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_RESPONSE_MESSAGE_KEY } from '../decorators/api-response-message.decorator';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already an ApiResponse (from exception filter), return it as is
        if (this.isApiResponse(data)) {
          return data;
        }

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        const message =
          this.reflector.get<string>(
            API_RESPONSE_MESSAGE_KEY,
            context.getHandler(),
          ) || 'Success';

        return {
          statusCode,
          message,
          data,
        };
      }),
    );
  }

  private isApiResponse(data: any): data is ApiResponse<any> {
    return (
      data &&
      typeof data === 'object' &&
      'statusCode' in data &&
      'message' in data &&
      'data' in data
    );
  }
}
