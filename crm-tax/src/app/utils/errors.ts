/**
 * Custom error classes and error handling utilities
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '인증이 필요합니다.', context?: Record<string, unknown>) {
    super('AUTHENTICATION_ERROR', message, 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '권한이 없습니다.', context?: Record<string, unknown>) {
    super('AUTHORIZATION_ERROR', message, 403, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super('NOT_FOUND', `${resource}을(를) 찾을 수 없습니다.`, 404, context);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = '네트워크 오류가 발생했습니다.', context?: Record<string, unknown>) {
    super('NETWORK_ERROR', message, 0, context);
    this.name = 'NetworkError';
  }
}

/**
 * Handles API errors and converts them to user-friendly messages
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Failed to fetch')) {
      return '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
    }
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * Retry logic for network requests
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
