import type { NextFunction, Request, Response } from 'express';
import { errorResponse } from '../utils/response.js';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(windowMs = 60000, maxRequests = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    let data = requestCounts.get(ip);

    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + windowMs };
      requestCounts.set(ip, data);
    }

    data.count += 1;

    if (data.count > maxRequests) {
      return res.status(429).json(
        errorResponse(429, 'RATE_LIMITED', 'Too many requests')
      );
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count).toString());
    res.setHeader('X-RateLimit-Reset', data.resetTime.toString());

    next();
  };
}

export function sanitizeInput(str: string): string {
  return str.trim().replace(/[<>]/g, '').substring(0, 1000);
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || ['http://localhost:3000'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}
