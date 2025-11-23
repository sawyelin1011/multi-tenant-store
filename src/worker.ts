import { Router } from 'itty-router';

const router = Router();

const jsonResponse = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const authResponse = (env: Record<string, string | undefined>, request: Request) => {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = env.SUPER_ADMIN_API_KEY;

  if (!expectedKey) {
    return jsonResponse(
      {
        success: false,
        code: 'SERVER_MISCONFIGURED',
        message: 'Server misconfigured',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return jsonResponse(
      {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
        timestamp: new Date().toISOString(),
      },
      401
    );
  }

  return null;
};

router.get('/health', () => {
  return jsonResponse({ success: true, code: 'SUCCESS', message: 'Health check passed', data: { status: 'ok' }, timestamp: new Date().toISOString() });
});

router.get('/api/users', (request, env) => {
  const error = authResponse(env as Record<string, string | undefined>, request);
  if (error) return error;

  return jsonResponse({
    success: true,
    code: 'SUCCESS',
    message: 'Users fetched',
    data: [],
    timestamp: new Date().toISOString(),
  });
});

router.all('*', () => jsonResponse({ success: false, code: 'NOT_FOUND', message: 'Not found', timestamp: new Date().toISOString() }, 404));

export default {
  async fetch(request: Request, env: Record<string, string | undefined>, ctx: any) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error: any) {
      return jsonResponse(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          ...(env?.NODE_ENV === 'development' ? { details: error?.message } : {}),
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  },
};
