import { Request } from 'express';
import { Tenant } from './index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  tenant?: Tenant;
  tenantId?: string;
}

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}
