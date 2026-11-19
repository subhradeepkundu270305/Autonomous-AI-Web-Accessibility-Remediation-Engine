import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode ?? 500;
  let message = err.isOperational ? err.message : 'Internal server error';

  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(', ') || 'Validation error';
  }

  // Log full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  } else {
    console.error(`[ERROR] ${statusCode} — ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/** Factory for operational (user-facing) errors. */
export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}
