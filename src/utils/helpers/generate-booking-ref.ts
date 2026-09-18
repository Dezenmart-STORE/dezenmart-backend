import { BookingType } from '../../models/bookingModel';

export function generateBookingRef(type: BookingType) {
  const prefix = type === 'ride' ? 'RID' : 'DLV';
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${ymd}-${random}`;
}
