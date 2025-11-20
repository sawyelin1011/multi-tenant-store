import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { AuthRequest, AdminAuthRequest } from '../types/express.js';

export function verifyAdminToken(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.adminJwtSecret!);
    req.admin = decoded as any;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function verifyApiKey(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedError('No API key provided');
    }

    if (apiKey !== config.superAdminApiKey) {
      throw new UnauthorizedError('Invalid API key');
    }

    // Set admin info for API key authentication
    req.admin = {
      id: 'super-admin-api-key',
      email: config.superAdminEmail,
    };
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid API key'));
  }
}

export function verifyAdminTokenOrApiKey(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      // API key authentication
      if (apiKey !== config.superAdminApiKey) {
        throw new UnauthorizedError('Invalid API key');
      }
      req.admin = {
        id: 'super-admin-api-key',
        email: config.superAdminEmail,
      };
    } else if (token) {
      // JWT token authentication
      const decoded = jwt.verify(token, config.adminJwtSecret!);
      req.admin = decoded as any;
    } else {
      throw new UnauthorizedError('No token or API key provided');
    }
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid authentication'));
  }
}

export function verifyTenantToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.tenantJwtSecret!);
    req.user = decoded as any;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalTenantToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.tenantJwtSecret!);
      req.user = decoded as any;
    }
    next();
  } catch (error) {
    next();
  }
}
