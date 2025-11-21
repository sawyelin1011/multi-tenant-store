import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { AuthRequest, AdminAuthRequest } from '../types/express.js';

export function verifyAdminToken(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided. Use Authorization: Bearer <token>');
    }

    if (!config.adminJwtSecret) {
      throw new UnauthorizedError('ADMIN_JWT_SECRET not configured in environment');
    }

    const decoded = jwt.verify(token, config.adminJwtSecret);
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
      throw new UnauthorizedError('No API key provided. Use x-api-key header with SUPER_ADMIN_API_KEY from .env');
    }

    if (!config.superAdminApiKey) {
      throw new UnauthorizedError('SUPER_ADMIN_API_KEY not configured in environment');
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
    next(new UnauthorizedError('API key authentication failed'));
  }
}

export function verifyAdminTokenOrApiKey(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      // API key authentication
      if (!config.superAdminApiKey) {
        throw new UnauthorizedError('SUPER_ADMIN_API_KEY not configured in environment');
      }
      if (apiKey !== config.superAdminApiKey) {
        throw new UnauthorizedError('Invalid API key');
      }
      req.admin = {
        id: 'super-admin-api-key',
        email: config.superAdminEmail,
      };
    } else if (token) {
      // JWT token authentication
      if (!config.adminJwtSecret) {
        throw new UnauthorizedError('ADMIN_JWT_SECRET not configured in environment');
      }
      const decoded = jwt.verify(token, config.adminJwtSecret);
      req.admin = decoded as any;
    } else {
      throw new UnauthorizedError('No token or API key provided. Use Authorization: Bearer <token> or x-api-key header');
    }
    next();
  } catch (error) {
    next(new UnauthorizedError('Authentication failed'));
  }
}

export function verifyTenantToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided. Use Authorization: Bearer <token>');
    }

    if (!config.tenantJwtSecret) {
      throw new UnauthorizedError('TENANT_JWT_SECRET not configured in environment');
    }

    const decoded = jwt.verify(token, config.tenantJwtSecret);
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
      if (!config.tenantJwtSecret) {
        // If tenant JWT secret is not configured, just skip token verification
        next();
        return;
      }
      const decoded = jwt.verify(token, config.tenantJwtSecret);
      req.user = decoded as any;
    }
    next();
  } catch (error) {
    // For optional token, just continue without setting user
    next();
  }
}
