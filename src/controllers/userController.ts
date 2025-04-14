import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CustomError } from '../middlewares/errorHandler';

export class UserController {
  static register = async (req: Request, res: Response) => {
    const user = await UserService.registerUser(req.body);
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
    });
  };

  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const authData = await UserService.authenticateUser(email, password);
    if (!authData) throw new CustomError('Invalid credentials', 401, 'fail');
    res.json(authData);
  };

  static getProfile = async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.user.id);
    res.json(user);
  };

  static updateProfile = async (req: Request, res: Response) => {
    const user = await UserService.updateUserProfile(req.user.id, req.body);
    res.json(user);
  };

  static getUserById = async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.params.id);
    if (!user) throw new CustomError('User not found', 404, 'fail');
    res.json(user);
  };
}
