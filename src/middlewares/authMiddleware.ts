import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { ErrorResponse, CustomError } from '../middlewares/errorHandler';
import config from '../configs/config';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new CustomError('Authentication token required', 401, 'fail');
      err.statusCode = 401;
      err.status = 'fail';
      throw err;
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      if (!config.JWT_SECRET) {
        throw new CustomError('JWT secret is not defined', 500, 'fail');
      }
      const payload = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
      if (!payload || typeof payload.id !== 'string') {
        throw new CustomError('Invalid token payload', 401, 'fail');
      }
      decoded = { id: payload.id };
    } catch (err) {
      const error = new CustomError('Invalid token', 401, 'fail');
      throw error;
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      const err = new CustomError('User not found', 401, 'fail');
      err.statusCode = 401;
      err.status = 'fail';
      throw err;
    }

    req.user = user;
    next();
  } catch (error) {
    const err = error as ErrorResponse;
    err.statusCode = 401;
    err.status = 'fail';
    err.message = 'Unauthorized access';
    next(err);
  }
};
