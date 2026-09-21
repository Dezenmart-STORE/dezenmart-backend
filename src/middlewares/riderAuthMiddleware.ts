import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './errorHandler';
import { IRider, Rider } from '../models/riderModel';
import config from '../configs/config';

type RiderAuthRequest = Request & { rider?: IRider };

export const authenticateRider = async (
  req: RiderAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authentication token required', 401, 'fail');
    }

    const token = authHeader.split(' ')[1];

    if (!config.RIDER_JWT_SECRET) {
      console.error('RIDER_JWT_SECRET is not defined in the configuration.');
      throw new CustomError('Server configuration error', 500, 'error');
    }

    let decoded: { id: string };
    try {
      const payload = jwt.verify(
        token,
        config.RIDER_JWT_SECRET,
      ) as jwt.JwtPayload;
      if (!payload || typeof payload.id !== 'string') {
        throw new CustomError('Invalid token payload', 401, 'fail');
      }
      decoded = { id: payload.id };
    } catch (err) {
      throw new CustomError('Invalid or expired token', 401, 'fail');
    }

    const rider = await Rider.findById(decoded.id);
    if (!rider) {
      throw new CustomError(
        'Rider associated with this token no longer exists',
        401,
        'fail',
      );
    }

    if (!rider.isActive) {
      throw new CustomError(
        'This rider account has been deactivated',
        403,
        'fail',
      );
    }

    req.rider = rider;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireVerifiedRider = (
  req: RiderAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.rider?.verificationStatus !== 'verified') {
    return next(
      new CustomError('Your rider account is not yet verified', 403, 'fail'),
    );
  }
  next();
};
