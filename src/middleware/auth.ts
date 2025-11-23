import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/response.js';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.SUPER_ADMIN_API_KEY;

  if (!expectedKey) {
    return next(new ApiError(500, 'SERVER_MISCONFIGURED', 'Server misconfigured'));
  }

  if (!apiKey || apiKey !== expectedKey) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Unauthorized - invalid or missing API key'));
  }

  next();
}
