import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { Booking } from '../models/bookingModel';
import { Rider } from '../models/riderModel';
import { OtpService } from './otpService';
import { RiderWalletService } from './riderWalletService';
import { serializePublicBooking } from './bookingService';

export class RiderBookingService {
  static async getRequests(riderId: string, page = 1, limit = 10) {
    const filter = {
      status: 'pending',
      paymentStatus: 'paid',
      rejectedBy: { $ne: riderId },
    };

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings: bookings.map(serializePublicBooking),
      total,
      page,
      limit,
    };
  }

  static async acceptRequest(bookingId: string, riderId: string) {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'pending', rejectedBy: { $ne: riderId } },
      {
        status: 'accepted',
        assignedRider: riderId,
        riderAssignedAt: new Date(),
        riderAcceptedAt: new Date(),
      },
      { new: true },
    );

    if (!booking) {
      throw new CustomError('Booking no longer available', 409, 'fail');
    }

    await Rider.findByIdAndUpdate(riderId, { availabilityStatus: 'on_trip' });

    return serializePublicBooking(booking);
  }

  static async rejectRequest(bookingId: string, riderId: string) {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'pending' },
      { $addToSet: { rejectedBy: riderId } },
      { new: true },
    );

    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }

    return { bookingRef: booking.bookingRef, status: booking.status };
  }

  static async updateStatus(bookingId: string, riderId: string, status: 'in_progress') {
    const booking = await Booking.findOne({ _id: bookingId, assignedRider: riderId });
    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }

    if (booking.status !== 'accepted') {
      throw new CustomError(
        `Cannot start a booking with status "${booking.status}"`,
        400,
        'fail',
      );
    }

    booking.status = status;
    booking.startedAt = new Date();
    await booking.save();

    await OtpService.createAndSendOtp({
      subjectType: 'booking',
      subjectId: booking._id.toString(),
      purpose: 'booking_completion',
      email: booking.customerEmail,
    });

    return serializePublicBooking(booking);
  }

  static async verifyCompletionOtp(bookingId: string, riderId: string, code: string) {
    const booking = await Booking.findOne({ _id: bookingId, assignedRider: riderId });
    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }

    if (booking.status !== 'in_progress') {
      throw new CustomError(
        `Cannot complete a booking with status "${booking.status}"`,
        400,
        'fail',
      );
    }

    await OtpService.verifyOtp({
      subjectType: 'booking',
      subjectId: booking._id.toString(),
      purpose: 'booking_completion',
      code,
    });

    const platformFeeAmount = Math.round(
      (booking.fareAmount * config.EXPRESS_PLATFORM_FEE_PERCENT) / 100,
    );
    const riderEarningAmount = booking.fareAmount - platformFeeAmount;

    booking.status = 'completed';
    booking.completedAt = new Date();
    booking.platformFeeAmount = platformFeeAmount;
    booking.riderEarningAmount = riderEarningAmount;
    await booking.save();

    await RiderWalletService.creditForBooking(riderId, booking._id.toString(), riderEarningAmount);

    await Rider.findByIdAndUpdate(riderId, {
      availabilityStatus: 'online',
      $inc: { totalTrips: 1, totalEarnings: riderEarningAmount },
    });

    return serializePublicBooking(booking);
  }
}
