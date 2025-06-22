import { User, IUser } from '../models/userModel';
import jwt from 'jsonwebtoken';
import { SelfBackendVerifier, getUserIdentifier } from '@selfxyz/core';
import { CustomError } from '../middlewares/errorHandler';
import config from '../configs/config';

// Interface for Self Protocol credential subject
interface SelfCredentialSubject {
  merkle_root?: string;
  attestation_id?: string;
  current_date?: string;
  issuing_state?: string;
  name?: string;
  passport_number?: string;
  date_of_birth?: string;
  nationality?: string;
  expiry_date?: string;
  facial_recognition_check?: boolean;
  mrz_check?: boolean;
  expiry_date_check?: boolean;
  name_and_yob_ofac?: boolean;
  passport_number_ofac?: boolean;
}

// Interface for Self Protocol validation details
interface SelfValidationDetails {
  isValidScope: boolean;
  isValidAttestationId: boolean;
  isValidProof: boolean;
  isValidNationality: boolean;
}

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

  static async verifySelfUser(
    userId: string,
    proof: any,
    publicSignals: any,
  ): Promise<IUser> {
    // Validate configuration
    if (
      !config.CELO_NODE_URL ||
      !config.SELF_APP_SCOPE ||
      !config.SELF_BACKEND_URL
    ) {
      throw new CustomError(
        'Self Protocol configuration missing. Please set CELO_NODE_URL, SELF_APP_SCOPE, and SELF_BACKEND_URL in your environment variables.',
        500,
        'error',
      );
    }

    try {
      // Initialize the SelfBackendVerifier with correct parameter order
      const selfBackendVerifier = new SelfBackendVerifier(
        config.SELF_APP_SCOPE,
        config.SELF_BACKEND_URL,
      );

      // Verify the proof
      const result = await selfBackendVerifier.verify(proof, publicSignals);

      if (result.isValid) {
        // Extract user identifier from public signals
        const selfId = await getUserIdentifier(publicSignals);

        // Check if this selfId is already used by another user
        const existingUserWithSelfId = await User.findOne({
          selfId: selfId,
          _id: { $ne: userId }, // Exclude current user
        });

        if (existingUserWithSelfId) {
          throw new CustomError(
            'This Self Protocol identity is already linked to another account.',
            409,
            'fail',
          );
        }

        // Extract nullifier (adjust index based on your proof structure)
        // The nullifier index may vary based on your specific proof implementation
        const nullifier = publicSignals[1] || publicSignals[0]; // Fallback to first element if second doesn't exist

        // Check if this nullifier is already used
        const existingUserWithNullifier = await User.findOne({
          'selfVerification.nullifier': nullifier,
          _id: { $ne: userId },
        });

        if (existingUserWithNullifier) {
          throw new CustomError(
            'This verification proof has already been used.',
            409,
            'fail',
          );
        }

        // Determine verification level based on credential subject data
        const verificationLevel = UserService.determineVerificationLevel(
          result.credentialSubject,
        );

        // Update user with Self Protocol verification data
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              selfId: selfId,
              selfVerification: {
                nullifier: nullifier,
                verificationLevel: verificationLevel,
                isVerified: true,
                credentialSubject: result.credentialSubject,
              },
            },
          },
          { new: true, runValidators: true },
        );

        if (!updatedUser) {
          throw new CustomError(
            'User not found after verification attempt',
            404,
            'fail',
          );
        }

        console.log('Self Protocol verification successful for user:', userId);
        return updatedUser;
      } else {
        console.error('Self verification failed:', result.isValidDetails);

        // Create a descriptive error message based on validation details
        const failureReasons = [];
        if (result.isValidDetails?.isValidScope === false)
          failureReasons.push('invalid scope');
        if (result.isValidDetails?.isValidAttestationId === false)
          failureReasons.push('invalid attestation ID');
        if (result.isValidDetails?.isValidProof === false)
          failureReasons.push('invalid proof');
        if (result.isValidDetails?.isValidNationality === false)
          failureReasons.push('invalid nationality');

        const errorMessage =
          failureReasons.length > 0
            ? `Verification failed: ${failureReasons.join(', ')}`
            : 'Invalid proof provided';

        throw new CustomError(
          `Self verification failed: ${errorMessage}`,
          400,
          'fail',
        );
      }
    } catch (error) {
      console.error('Error during Self Protocol verification:', error);

      // Re-throw CustomError instances
      if (error instanceof CustomError) {
        throw error;
      }

      // Handle other errors
      throw new CustomError(
        `Self Protocol verification error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        500,
        'error',
      );
    }
  }

  // Helper method to check if user is verified with Self Protocol
  static async isUserSelfVerified(userId: string): Promise<boolean> {
    const user = await User.findById(userId).select('selfVerification');
    return user?.selfVerification?.isVerified === true;
  }

  // Helper method to get user's Self Protocol verification level
  static async getUserSelfVerificationLevel(
    userId: string,
  ): Promise<string | null> {
    const user = await User.findById(userId).select('selfVerification');
    return user?.selfVerification?.verificationLevel || null;
  }

  // Helper method to determine verification level based on credential subject
  static determineVerificationLevel(
    credentialSubject: SelfCredentialSubject,
  ): string {
    if (!credentialSubject) {
      return 'basic';
    }

    // Count how many verification checks passed
    let verificationScore = 0;
    const securityChecks = [
      'expiry_date_check',
      'facial_recognition_check',
      'mrz_check',
      'name_and_yob_ofac',
      'passport_number_ofac',
    ];

    securityChecks.forEach((check) => {
      if (credentialSubject[check as keyof SelfCredentialSubject] === true) {
        verificationScore++;
      }
    });

    // Check for completeness of personal data
    const hasCompleteData =
      credentialSubject.passport_number &&
      credentialSubject.name &&
      credentialSubject.date_of_birth &&
      credentialSubject.nationality;

    // Determine level based on verification score and available data
    if (verificationScore >= 4 && hasCompleteData) {
      return 'kyc_verified'; // Highest level - full KYC
    } else if (
      verificationScore >= 3 &&
      credentialSubject.passport_number &&
      credentialSubject.name
    ) {
      return 'advanced'; // High level - most checks passed
    } else if (
      verificationScore >= 2 &&
      (credentialSubject.name || credentialSubject.passport_number)
    ) {
      return 'intermediate'; // Medium level - some checks passed
    } else {
      return 'basic'; // Basic level - minimal verification
    }
  }

  // Method to revoke Self Protocol verification (if needed)
  static async revokeSelfVerification(userId: string): Promise<IUser> {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          selfId: 1,
          selfVerification: 1,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new CustomError('User not found', 404, 'fail');
    }

    return updatedUser;
  }
}
