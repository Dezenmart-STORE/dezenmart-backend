import { User, IUser } from '../models/userModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UserService {
  static async registerUser(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({
      ...userData,
      password: hashedPassword,
    });
    return await user.save();
  }

  static async authenticateUser(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        isMerchant: user.isMerchant,
        rating: user.rating,
      },
      token,
    };
  }

  static async updateUserProfile(userId: string, updateData: Partial<IUser>) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  static async getUserById(id: string) {
    return await User.findById(id).select('-password');
  }
}
