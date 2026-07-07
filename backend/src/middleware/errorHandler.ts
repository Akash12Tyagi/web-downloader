import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types';
import { logger } from '../utils/logger';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors[0]?.message ?? 'Invalid request.',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(err.message, { code: err.code, path: req.path });
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  logger.error('Unhandled error', {
    path: req.path,
    message: err instanceof Error ? err.message : String(err),
  });
  res
    .status(500)
    .json({ error: 'Something went wrong on our end. Please try again.', code: 'INTERNAL_ERROR' });
}

export function asyncHandler<
  T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
