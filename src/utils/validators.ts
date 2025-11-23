import { z } from 'zod';
import { ApiError } from './response.js';

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['user', 'admin']).default('user'),
});

const createTenantSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric'),
});

const createStoreSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID required'),
  name: z.string().min(1, 'Name required').max(255),
  type: z.enum(['digital', 'physical', 'hybrid']).default('digital'),
});

const createProductSchema = z.object({
  store_id: z.string().min(1, 'Store ID required'),
  name: z.string().min(1, 'Name required').max(255),
  sku: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  description: z.string().optional(),
  type: z.enum(['digital', 'physical']).default('digital'),
});

const createOrderSchema = z.object({
  store_id: z.string().min(1, 'Store ID required'),
  user_id: z.string().optional(),
  total: z.number().positive(),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(', ');
      throw new ApiError(400, 'VALIDATION_ERROR', message);
    }
    throw error;
  }
}

export {
  createUserSchema,
  createTenantSchema,
  createStoreSchema,
  createProductSchema,
  createOrderSchema,
};
