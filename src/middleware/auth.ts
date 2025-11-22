import { NextFunction, Request, Response } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.SUPER_ADMIN_API_KEY;

  if (!expectedKey) {
    console.error('❌ SUPER_ADMIN_API_KEY not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized - invalid or missing API key' });
  }

  res.locals.user = { role: 'admin', apiKey };
  next();
}
