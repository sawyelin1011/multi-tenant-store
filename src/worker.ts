import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { HonoEnv } from './types/bindings.js';
import { setBindings, createWorkerConfig } from './config/bindings.js';
import { AppError } from './utils/errors.js';
import { registerAdminRoutes } from './routes/worker-admin.js';
import { registerTenantRoutes } from './routes/worker-tenant.js';
import { registerStorefrontRoutes } from './routes/worker-storefront.js';

const app = new Hono<HonoEnv>();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  })
);

// Initialize bindings
app.use('*', async (c, next) => {
  setBindings(c.env.Bindings);
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register routes
registerAdminRoutes(app);
registerTenantRoutes(app);
registerStorefrontRoutes(app);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not found',
      statusCode: 404,
    },
    404
  );
});

// Error handler
app.onError(async (err, c) => {
  console.error('[Error]', err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
        statusCode: err.status,
      },
      err.status
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: err.message,
        statusCode: err.statusCode,
      },
      err.statusCode
    );
  }

  if (err instanceof SyntaxError) {
    return c.json(
      {
        success: false,
        error: 'Invalid JSON',
        statusCode: 400,
      },
      400
    );
  }

  return c.json(
    {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    },
    500
  );
});

export default app;
