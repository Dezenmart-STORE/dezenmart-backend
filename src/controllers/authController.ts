import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/userService';

export class AuthController {
  static googleOneTap = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { credential } = req.body as { credential?: string };
      const { user, token } =
        await UserService.authenticateWithGoogleOneTap(credential!);

      res.status(200).json({
        status: 'success',
        data: { token, user },
      });
    } catch (error) {
      next(error);
    }
  };
}
