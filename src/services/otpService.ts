import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { OtpCode, OtpPurpose, OtpSubjectType } from '../models/otpCodeModel';
import { generateOtpCode, hashOtpCode } from '../utils/otp';
import { MailerService } from './mailerService';

const MAX_ATTEMPTS = 5;

interface OtpSubject {
  subjectType: OtpSubjectType;
  subjectId: string;
  purpose: OtpPurpose;
}

export class OtpService {
  static async createAndSendOtp({
    subjectType,
    subjectId,
    purpose,
    email,
  }: OtpSubject & { email: string }) {
    await OtpCode.deleteMany({ subjectType, subjectId, purpose, consumedAt: null });

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    await OtpCode.create({
      subjectType,
      subjectId,
      purpose,
      codeHash,
      destinationEmail: email,
      expiresAt,
    });

    await MailerService.sendOtpEmail(email, code, purpose);
  }

  static async verifyOtp({
    subjectType,
    subjectId,
    purpose,
    code,
  }: OtpSubject & { code: string }) {
    const otp = await OtpCode.findOne({
      subjectType,
      subjectId,
      purpose,
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otp) {
      throw new CustomError('OTP not found or already used', 404, 'fail');
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      throw new CustomError('OTP expired', 410, 'fail');
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new CustomError('Too many attempts, request a new OTP', 429, 'fail');
    }

    if (hashOtpCode(code) !== otp.codeHash) {
      otp.attempts += 1;
      await otp.save();
      throw new CustomError('Invalid OTP', 401, 'fail');
    }

    otp.consumedAt = new Date();
    await otp.save();
  }
}
