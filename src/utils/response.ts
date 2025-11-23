export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function successResponse<T>(data: T, message = 'Success') {
  return {
    success: true,
    code: 'SUCCESS',
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(statusCode: number, code: string, message: string, details?: any) {
  return {
    success: false,
    code,
    message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString(),
  };
}
