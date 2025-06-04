import { User, IUser } from '../models/userModel';
import jwt from 'jsonwebtoken';

export class UserService {
  static async findOrCreateUser(
    profile: any,
  ): Promise<{ user: IUser; token: string }> {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        user.googleId = profile.id;
        await user.save();
      } else {
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          profileImage: profile.photos[0]?.value,
        });
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );
    return { user, token };
  }

  static async getUserByEmail(email: string) {
    return await User.findOne({ email });
  }

  static async getUserById(id: string) {
    return await User.findById(id)
      .select('-password')
      .populate({
        path: 'orders',
        select: 'product amount status createdAt quantity purchaseId seller',
        populate: [
          {
            path: 'product',
            select: 'name images price',
          },
          {
            path: 'seller',
            select: 'name profileImage',
          },
        ],
        options: { sort: { createdAt: -1 }, limit: 10 },
      });
  }

  static async updateUser(id: string, data: Partial<IUser>) {
    return await User.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteUser(id: string) {
    return await User.findByIdAndDelete(id);
  }

  static async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return await User.find().skip(skip).limit(limit).select('-password');
  }
}
