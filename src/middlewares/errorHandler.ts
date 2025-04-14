import { NextFunction, Request, Response } from 'express';

export interface ErrorResponse extends Error {
  statusCode?: number;
  status?: string;
}

export class CustomError extends Error implements ErrorResponse {
  statusCode: number;
  status: string;

  constructor(message: string, statusCode: number, status: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
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

  console.error(`Error: ${message}`);
  res.status(statusCode).json({
    status,
    message,
  });
};
