import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role, IUser } from '../models/userModel';
import { ErrorResponse, CustomError } from '../middlewares/errorHandler';
import config from '../configs/config';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
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
      throw new CustomError('Authentication token required', 401, 'fail');
    }

    const token = authHeader.split(' ')[1];

    if (!config.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in the configuration.');
      throw new CustomError('Server configuration error', 500, 'error');
    }

    let decoded: { id: string };
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
      if (!payload || typeof payload.id !== 'string') {
        throw new CustomError('Invalid token payload', 401, 'fail');
      }
      decoded = { id: payload.id };
    } catch (err) {
      throw new CustomError('Invalid or expired token', 401, 'fail');
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new CustomError(
        'User associated with this token no longer exists',
        401,
        'fail',
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles) {
      return next(
        new CustomError(
          'User not authenticated or roles are missing',
          403,
          'fail',
        ),
      );
    }

    const userRoles = req.user.roles as Role[];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(
        new CustomError(
          'You do not have permission to perform this action',
          403,
          'fail',
        ),
      );
    }

    next();
  };
};
