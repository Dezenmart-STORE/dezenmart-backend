import { NextFunction, Request, Response } from 'express';

export interface ErrorResponse extends Error {
  statusCode?: number;
  status?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export class CustomError extends Error implements ErrorResponse {
  statusCode: number;
  status: string;
  details?: Array<{
    field: string;
    message: string;
  }>;

  constructor(
    message: string,
    statusCode: number,
    status: string,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.details = details;
  }
}

export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Something went wrong';

  console.error(`Error: ${message}`, err.details || '');
  res.status(statusCode).json({
    status,
    message,
    ...(err.details ? { errors: err.details } : {}),
  });
};
