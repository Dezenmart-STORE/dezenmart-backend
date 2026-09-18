import { CustomError } from '../middlewares/errorHandler';
import { Booking, BookingType, IBooking } from '../models/bookingModel';
import { generateBookingRef } from '../utils/helpers/generate-booking-ref';

const BOOKING_REF_MAX_ATTEMPTS = 3;

interface BaseBookingInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress: { label?: string; address: string; lat?: number; lng?: number };
  dropoffAddress: { label?: string; address: string; lat?: number; lng?: number };
  distanceKm?: number;
  fareAmount: number;
  currency?: string;
  notes?: string;
}

interface BookRideInput extends BaseBookingInput {
  rideType?: 'standard' | 'premium';
  passengerCount?: number;
}

interface BookDeliveryInput extends BaseBookingInput {
  package: { description: string; sizeCategory?: 'small' | 'medium' | 'large'; weightKg?: number; value?: number };
  recipientName: string;
  recipientPhone: string;
}

async function generateUniqueBookingRef(type: BookingType) {
  for (let attempt = 0; attempt < BOOKING_REF_MAX_ATTEMPTS; attempt += 1) {
    const bookingRef = generateBookingRef(type);
    const exists = await Booking.exists({ bookingRef });
    if (!exists) return bookingRef;
  }
  throw new CustomError('Could not generate a unique booking reference, please retry', 500, 'error');
}

export function serializePublicBooking(booking: IBooking) {
  const assignedRider =
    booking.assignedRider && typeof booking.assignedRider === 'object' && 'name' in booking.assignedRider
      ? {
          id: (booking.assignedRider as any)._id,
          name: (booking.assignedRider as any).name,
          phone: (booking.assignedRider as any).phone,
          vehicleType: (booking.assignedRider as any).vehicleType,
          vehiclePlateNumber: (booking.assignedRider as any).vehiclePlateNumber,
          rating: (booking.assignedRider as any).rating,
        }
      : booking.assignedRider ?? undefined;

  return {
    bookingRef: booking.bookingRef,
    type: booking.type,
    status: booking.status,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    pickupAddress: booking.pickupAddress,
    dropoffAddress: booking.dropoffAddress,
    rideType: booking.rideType,
    passengerCount: booking.passengerCount,
    package: booking.package,
    recipientName: booking.recipientName,
    recipientPhone: booking.recipientPhone,
    distanceKm: booking.distanceKm,
    fareAmount: booking.fareAmount,
    currency: booking.currency,
    paymentStatus: booking.paymentStatus,
    assignedRider,
    startedAt: booking.startedAt,
    completedAt: booking.completedAt,
    cancelledAt: booking.cancelledAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export class BookingService {
  static async bookRide(input: BookRideInput) {
    const bookingRef = await generateUniqueBookingRef('ride');
    const booking = await Booking.create({
      bookingRef,
      type: 'ride',
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      pickupAddress: input.pickupAddress,
      dropoffAddress: input.dropoffAddress,
      rideType: input.rideType ?? 'standard',
      passengerCount: input.passengerCount ?? 1,
      distanceKm: input.distanceKm,
      fareAmount: input.fareAmount,
      currency: input.currency ?? 'NGN',
      notes: input.notes,
    });

    return serializePublicBooking(booking);
  }

  static async bookDelivery(input: BookDeliveryInput) {
    const bookingRef = await generateUniqueBookingRef('delivery');
    const booking = await Booking.create({
      bookingRef,
      type: 'delivery',
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      pickupAddress: input.pickupAddress,
      dropoffAddress: input.dropoffAddress,
      package: input.package,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      distanceKm: input.distanceKm,
      fareAmount: input.fareAmount,
      currency: input.currency ?? 'NGN',
      notes: input.notes,
    });

    return serializePublicBooking(booking);
  }

  static async findOrders(query: { email?: string; phone?: string }, page = 1, limit = 10) {
    const filter: Record<string, unknown> = {};
    if (query.email) filter.customerEmail = query.email.toLowerCase();
    if (query.phone) filter.customerPhone = query.phone;

    if (!filter.customerEmail && !filter.customerPhone) {
      throw new CustomError('email or phone query parameter is required', 422, 'fail');
    }

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('assignedRider', 'name phone vehicleType vehiclePlateNumber rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings: bookings.map(serializePublicBooking),
      total,
      page,
      limit,
    };
  }

  static async findByBookingRef(bookingRef: string) {
    const booking = await Booking.findOne({ bookingRef }).populate(
      'assignedRider',
      'name phone vehicleType vehiclePlateNumber rating',
    );
    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }
    return serializePublicBooking(booking);
  }

  static async getStatus(bookingRef: string) {
    const booking = await Booking.findOne({ bookingRef }).populate(
      'assignedRider',
      'name phone vehicleType vehiclePlateNumber rating',
    );
    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }

    const assignedRider =
      booking.assignedRider && 'name' in (booking.assignedRider as any)
        ? {
            id: (booking.assignedRider as any)._id,
            name: (booking.assignedRider as any).name,
            phone: (booking.assignedRider as any).phone,
            vehicleType: (booking.assignedRider as any).vehicleType,
            vehiclePlateNumber: (booking.assignedRider as any).vehiclePlateNumber,
            rating: (booking.assignedRider as any).rating,
          }
        : undefined;

    return {
      bookingRef: booking.bookingRef,
      type: booking.type,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      assignedRider,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
    };
  }

  static async cancelBooking(bookingRef: string, reason?: string) {
    const booking = await Booking.findOne({ bookingRef });
    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }

    if (booking.status !== 'pending') {
      throw new CustomError(
        `Cannot cancel a booking with status "${booking.status}"`,
        400,
        'fail',
      );
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'customer';
    booking.cancellationReason = reason;
    await booking.save();

    return serializePublicBooking(booking);
  }
}
