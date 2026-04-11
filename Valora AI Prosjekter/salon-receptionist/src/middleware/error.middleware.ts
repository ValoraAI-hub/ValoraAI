/**
 * Global error-handling middleware.
 *
 * Catches any error thrown / passed to next() in route handlers,
 * logs it, and returns a consistent JSON error response.
 *
 * Must be registered LAST (after all routes) in src/index.ts.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ message: err.message, stack: err.stack, path: req.path });

  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
