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

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['user', 'admin']).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1, 'Name required').max(255).optional(),
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric').optional(),
  config: z.record(z.any()).optional(),
});

const updateStoreSchema = z.object({
  name: z.string().min(1, 'Name required').max(255).optional(),
  type: z.enum(['digital', 'physical', 'hybrid']).optional(),
  config: z.record(z.any()).optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name required').max(255).optional(),
  price: z.number().positive('Price must be positive').optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  type: z.enum(['digital', 'physical']).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
  total: z.number().positive().optional(),
});

const createOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID required'),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
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
  updateUserSchema,
  updateTenantSchema,
  updateStoreSchema,
  updateProductSchema,
  updateOrderSchema,
  createOrderItemSchema,
  paginationSchema,
};
