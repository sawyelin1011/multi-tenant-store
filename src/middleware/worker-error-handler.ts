import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoEnv } from '../types/bindings.js';
import { AppError } from '../utils/errors.js';

export function createErrorHandler() {
  return async (err: Error, c: Context<HonoEnv>) => {
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
  };
}
