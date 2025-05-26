import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CustomError } from '../middlewares/errorHandler';

export class UserController {
  static getUserByEmail = async (req: Request, res: Response) => {
    const user = await UserService.getUserByEmail(req.params.email);
    res.json(user);
  };

  static getAllUsers = async (req: Request, res: Response) => {
    const users = await UserService.getAllUsers(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(users);
  };

  static getProfile = async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.user.id);
    res.json(user);
  };

  static updateProfile = async (req: Request, res: Response) => {
    const userId = req.user.id;
    const updateData = { ...req.body };
    const file = req.file as Express.Multer.File | undefined;

    if (file) {
      const imageFilename = file.path;
      updateData.profileImage = imageFilename;
    }

    const updatedUser = await UserService.updateUser(userId, updateData);
    if (!updatedUser) throw new CustomError('User not found', 404, 'fail');
    res.json(updatedUser);
  };

  static getUserById = async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.params.id);
    if (!user) throw new CustomError('User not found', 404, 'fail');
    res.json(user);
  };

  static deleteUser = async (req: Request, res: Response) => {
    const user = await UserService.deleteUser(req.params.id);
    if (!user) throw new CustomError('User not found', 404, 'fail');
    res.json({ success: true });
  };
}
