import { Router } from 'itty-router';
import { D1Client, CloudflareEnv } from '../db/d1.js';
import { KVCache } from '../utils/cache-kv.js';
import { R2Storage } from '../utils/r2-upload.js';

const router = Router();

interface WorkerRequest extends Request {
  env?: CloudflareEnv;
  ctx?: any;
}

const jsonResponse = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const handleRequest = async (request: WorkerRequest, env: CloudflareEnv, ctx: any) => {
  try {
    // Initialize services
    const db = new D1Client(env.DB);
    const cache = new KVCache(env.CACHE);
    const uploads = new R2Storage(env.UPLOADS);

    // Attach services to request
    request.env = env;
    request.ctx = ctx;

    // Health check endpoint (no auth required)
    if (request.url.includes('/health')) {
      return jsonResponse({
        success: true,
        code: 'SUCCESS',
        message: 'Health check passed',
        data: { status: 'ok', environment: env.ENVIRONMENT },
        timestamp: new Date().toISOString(),
      });
    }

    // Auth middleware for /api routes
    if (request.url.includes('/api')) {
      const apiKey = request.headers.get('x-api-key');
      if (!apiKey) {
        return jsonResponse(
          {
            success: false,
            code: 'UNAUTHORIZED',
            message: 'Missing API key',
            timestamp: new Date().toISOString(),
          },
          401
        );
      }
    }

    // Route all API requests to handler
    if (request.url.includes('/api')) {
      return handleApiRequest(request, db, cache, uploads);
    }

    return jsonResponse({ success: false, code: 'NOT_FOUND', message: 'Not found', timestamp: new Date().toISOString() }, 404);
  } catch (error: any) {
    console.error('Worker error:', error);
    return jsonResponse(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error?.message,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

const handleApiRequest = async (request: WorkerRequest, db: D1Client, cache: KVCache, uploads: R2Storage) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Example: GET /api/users
  if (path === '/api/users' && request.method === 'GET') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const cacheKey = `users:list:${limit}:${offset}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return jsonResponse({
        success: true,
        code: 'SUCCESS',
        message: 'Users fetched (cache)',
        data: cached,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const result = await db.query('SELECT * FROM users LIMIT ? OFFSET ?', [limit, offset]);
      const response = {
        data: result.results || [],
        limit,
        offset,
        hasMore: (result.results?.length || 0) === limit,
      };

      await cache.set(cacheKey, response, 3600);
      return jsonResponse({
        success: true,
        code: 'SUCCESS',
        message: 'Users fetched',
        data: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return jsonResponse(
        {
          success: false,
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch users',
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  }

  // Example: GET /api/health
  if (path === '/api/health' && request.method === 'GET') {
    return jsonResponse({
      success: true,
      code: 'SUCCESS',
      message: 'API health check passed',
      data: { status: 'ok' },
      timestamp: new Date().toISOString(),
    });
  }

  return jsonResponse({ success: false, code: 'NOT_FOUND', message: 'Endpoint not found', timestamp: new Date().toISOString() }, 404);
};

const handleScheduled = async (event: any, env: CloudflareEnv, ctx: any) => {
  console.log('🔄 Running scheduled task at:', new Date().toISOString());

  try {
    const cache = new KVCache(env.CACHE);
    // Clear old cache entries
    await cache.clear('users:list');
    console.log('✅ Cache cleanup complete');
  } catch (error: any) {
    console.error('❌ Scheduled task failed:', error);
  }
};

export default {
  fetch: (request: Request, env: CloudflareEnv, ctx: any) => handleRequest(request as WorkerRequest, env, ctx),
  scheduled: (event: any, env: CloudflareEnv, ctx: any) => handleScheduled(event, env, ctx),
};
