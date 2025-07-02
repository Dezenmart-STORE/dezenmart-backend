import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CustomError } from '../middlewares/errorHandler';

declare module 'express-session' {
  interface SessionData {
    pendingProfile?: any;
    termsAccepted?: boolean;
  }
}

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

  static verifySelf = async (req: Request, res: Response) => {
    try {
      const { proof, publicSignals } = req.body;

      // Validate required fields
      if (!proof || !publicSignals) {
        throw new CustomError(
          'Missing required fields: proof and publicSignals are required in the request body.',
          400,
          'fail',
        );
      }

      // Validate proof structure (basic validation)
      if (typeof proof !== 'object' || !Array.isArray(publicSignals)) {
        throw new CustomError(
          'Invalid data format: proof must be an object and publicSignals must be an array.',
          400,
          'fail',
        );
      }

      // Check if user is already verified
      const isAlreadyVerified = await UserService.isUserSelfVerified(
        req.user.id,
      );
      if (isAlreadyVerified) {
        res.status(409).json({
          status: 'fail',
          message: 'User is already verified with Self Protocol.',
        });
        return;
      }

      // Perform verification
      const updatedUser = await UserService.verifySelfUser(
        req.user.id,
        proof,
        publicSignals,
      );

      res.status(200).json({
        status: 'success',
        message: 'User successfully verified with Self Protocol.',
        data: {
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            selfId: updatedUser.selfId,
            selfVerification: updatedUser.selfVerification,
          },
        },
      });
    } catch (error) {
      console.error('Self Protocol verification error:', error);

      // If it's already a CustomError, let the error handler deal with it
      if (error instanceof CustomError) {
        throw error;
      }

      // Handle unexpected errors
      throw new CustomError(
        'An unexpected error occurred during verification.',
        500,
        'error',
      );
    }
  };

  static getSelfVerificationStatus = async (req: Request, res: Response) => {
    try {
      const isVerified = await UserService.isUserSelfVerified(req.user.id);
      const verificationLevel = await UserService.getUserSelfVerificationLevel(
        req.user.id,
      );

      res.status(200).json({
        status: 'success',
        data: {
          isVerified,
          verificationLevel,
        },
      });
    } catch (error) {
      console.error('Error checking Self verification status:', error);
      throw new CustomError(
        'Failed to check verification status.',
        500,
        'error',
      );
    }
  };

  static revokeSelfVerification = async (req: Request, res: Response) => {
    try {
      const isVerified = await UserService.isUserSelfVerified(req.user.id);
      if (!isVerified) {
        throw new CustomError(
          'User is not currently verified with Self Protocol.',
          400,
          'fail',
        );
      }

      const updatedUser = await UserService.revokeSelfVerification(req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Self Protocol verification successfully revoked.',
        data: {
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            selfId: updatedUser.selfId,
            selfVerification: updatedUser.selfVerification,
          },
        },
      });
    } catch (error) {
      console.error('Error revoking Self verification:', error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        'Failed to revoke Self Protocol verification.',
        500,
        'error',
      );
    }
  };

  static acceptTermsAndContinue = async (req: Request, res: Response) => {
    try {
      const { accepted } = req.body;

      if (!accepted) {
        throw new CustomError(
          'You must accept the Terms and Conditions to continue.',
          400,
          'fail',
        );
      }

      // Check if there's a pending profile in session
      const pendingProfile = req.session?.pendingProfile;
      if (!pendingProfile) {
        throw new CustomError(
          'No pending authentication found. Please start the sign-up process again.',
          400,
          'fail',
        );
      }

      // Accept terms and create/update user
      const { user, token } =
        await UserService.acceptTermsWithProfile(pendingProfile);

      // Clear session data
      delete req.session!.pendingProfile;

      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: 'success',
        message: 'Terms accepted and account created successfully.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            hasAcceptedTerms: user.hasAcceptedTerms,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Error accepting terms:', error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        'Failed to accept terms and create account.',
        500,
        'error',
      );
    }
  };

  // Get terms acceptance status for existing user
  static getTermsStatus = async (req: Request, res: Response) => {
    try {
      const { email } = req.query;

      if (!email) {
        throw new CustomError('Email is required.', 400, 'fail');
      }

      const user = await UserService.getUserByEmail(email as string);

      res.status(200).json({
        status: 'success',
        data: {
          hasAcceptedTerms: user?.hasAcceptedTerms || false,
          userExists: !!user,
        },
      });
    } catch (error) {
      console.error('Error checking terms status:', error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError('Failed to check terms status.', 500, 'error');
    }
  };

  // Accept terms for existing user
  static acceptTermsExistingUser = async (req: Request, res: Response) => {
    try {
      const { email, accepted } = req.body;

      if (!accepted) {
        throw new CustomError(
          'You must accept the Terms and Conditions to continue.',
          400,
          'fail',
        );
      }

      if (!email) {
        throw new CustomError('Email is required.', 400, 'fail');
      }

      const user = await UserService.getUserByEmail(email);

      if (!user) {
        throw new CustomError('User not found.', 404, 'fail');
      }

      // Update user's terms acceptance
      const updatedUser = await UserService.acceptTerms(
        (user as { _id: string })._id.toString(),
      );

      // Mark terms as accepted in session for OAuth flow
      req.session!.termsAccepted = true;

      res.status(200).json({
        status: 'success',
        message: 'Terms and Conditions accepted successfully.',
        data: {
          hasAcceptedTerms: updatedUser.hasAcceptedTerms,
        },
      });
    } catch (error) {
      console.error('Error accepting terms for existing user:', error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError('Failed to accept terms.', 500, 'error');
    }
  };
}
