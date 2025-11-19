import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { HonoEnv } from '../types/bindings.js';
import { UnauthorizedError } from '../utils/errors.js';

export async function verifyAdminTokenWorker(c: Context<HonoEnv>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const bindings = c.env.Bindings;
    const decoded = jwt.verify(token, bindings.ADMIN_JWT_SECRET);
    c.set('admin', decoded as any);
    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function verifyTenantTokenWorker(c: Context<HonoEnv>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const bindings = c.env.Bindings;
    const decoded = jwt.verify(token, bindings.TENANT_JWT_SECRET);
    c.set('user', decoded as any);
    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function optionalTenantTokenWorker(c: Context<HonoEnv>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (token) {
      const bindings = c.env.Bindings;
      const decoded = jwt.verify(token, bindings.TENANT_JWT_SECRET);
      c.set('user', decoded as any);
    }
    await next();
  } catch (error) {
    await next();
  }
}
