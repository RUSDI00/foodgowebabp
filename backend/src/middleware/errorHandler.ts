import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/utils';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: 'error',
    });
  }

  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    error: 'Internal server error',
    status: 'error',
  });
}; 