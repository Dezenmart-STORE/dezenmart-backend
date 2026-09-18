import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { IRider, Rider } from '../models/riderModel';
import { OtpService } from './otpService';

interface RegisterRiderInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleType: IRider['vehicleType'];
  vehiclePlateNumber: string;
  driverLicenseNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

function serializePublicRider(rider: IRider) {
  return {
    id: rider._id,
    name: rider.name,
    vehicleType: rider.vehicleType,
    vehiclePlateNumber: rider.vehiclePlateNumber,
    profileImage: rider.profileImage,
    rating: rider.rating,
    totalTrips: rider.totalTrips,
    availabilityStatus: rider.availabilityStatus,
  };
}

function serializeRiderProfile(rider: IRider) {
  return {
    id: rider._id,
    name: rider.name,
    email: rider.email,
    phone: rider.phone,
    vehicleType: rider.vehicleType,
    vehiclePlateNumber: rider.vehiclePlateNumber,
    driverLicenseNumber: rider.driverLicenseNumber,
    profileImage: rider.profileImage,
    verificationStatus: rider.verificationStatus,
    availabilityStatus: rider.availabilityStatus,
    rating: rider.rating,
    totalTrips: rider.totalTrips,
    totalEarnings: rider.totalEarnings,
  };
}

function mintRiderToken(rider: IRider): string {
  if (!config.RIDER_JWT_SECRET) {
    throw new CustomError('Server configuration error', 500, 'error');
  }
  return jwt.sign({ id: rider._id, email: rider.email }, config.RIDER_JWT_SECRET, {
    expiresIn: config.RIDER_JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export class RiderService {
  static async register(input: RegisterRiderInput) {
    const existing = await Rider.findOne({
      $or: [{ email: input.email.toLowerCase() }, { phone: input.phone }],
    });
    if (existing) {
      throw new CustomError('A rider with this email or phone already exists', 409, 'fail');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const rider = await Rider.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      vehicleType: input.vehicleType,
      vehiclePlateNumber: input.vehiclePlateNumber,
      driverLicenseNumber: input.driverLicenseNumber,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      bankAccountName: input.bankAccountName,
    });

    return serializeRiderProfile(rider);
  }

  static async login(email: string, password: string) {
    const rider = await Rider.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!rider) {
      throw new CustomError('Invalid email or password', 401, 'fail');
    }

    const isMatch = await bcrypt.compare(password, rider.passwordHash);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 401, 'fail');
    }

    if (!rider.isActive) {
      throw new CustomError('This rider account has been deactivated', 403, 'fail');
    }

    await OtpService.createAndSendOtp({
      subjectType: 'rider',
      subjectId: rider._id.toString(),
      purpose: 'rider_login',
      email: rider.email,
    });

    return { message: 'An OTP has been sent to your email' };
  }

  static async verifyLoginOtp(email: string, code: string) {
    const rider = await Rider.findOne({ email: email.toLowerCase() });
    if (!rider) {
      throw new CustomError('Invalid email or password', 401, 'fail');
    }

    await OtpService.verifyOtp({
      subjectType: 'rider',
      subjectId: rider._id.toString(),
      purpose: 'rider_login',
      code,
    });

    const token = mintRiderToken(rider);
    return { token, rider: serializeRiderProfile(rider) };
  }

  static async getAvailableRiders(page = 1, limit = 10) {
    const filter = {
      availabilityStatus: 'online',
      verificationStatus: 'verified',
      isActive: true,
    };

    const skip = (page - 1) * limit;
    const [riders, total] = await Promise.all([
      Rider.find(filter).sort({ rating: -1 }).skip(skip).limit(limit),
      Rider.countDocuments(filter),
    ]);

    return {
      riders: riders.map(serializePublicRider),
      total,
      page,
      limit,
    };
  }

  static async getRiderById(riderId: string) {
    const rider = await Rider.findById(riderId);
    if (!rider) {
      throw new CustomError('Rider not found', 404, 'fail');
    }
    return serializePublicRider(rider);
  }
}
