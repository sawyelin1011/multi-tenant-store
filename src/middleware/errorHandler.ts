import { Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { AuthRequest } from '../types/express.js';

export function errorHandler(error: Error, req: AuthRequest, res: Response, next: NextFunction) {
  console.error('[Error]', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      statusCode: error.statusCode,
    });
  }

  if (error instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      statusCode: 400,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    statusCode: 500,
  });
}
