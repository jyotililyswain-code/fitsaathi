-- FitSaathi registrations and coach/dojo bookings are permanently free.
-- Keep historical payment/order records intact, but remove every monetary and
-- payment-review prerequisite from service bookings and provider listings.

UPDATE public.bookings
SET
  amount = 0,
  "originalPrice" = 0,
  "platformFee" = 0,
  "finalPrice" = 0,
  "coachPayout" = 0,
  "payoutAmount" = 0,
  "commissionAmount" = 0,
  "paymentStatus" = 'not_required',
  "payoutStatus" = 'not_due';

UPDATE public.bookings
SET status = 'confirmed'
WHERE status = 'pending';

UPDATE public.coaches
SET
  "baseFee" = 0,
  "platformFee" = 0,
  "customerPrice" = 0,
  "coachPayout" = 0;

UPDATE public.dojos
SET
  "originalPrice" = 0,
  "finalPrice" = 0,
  "registrationPaymentStatus" = 'not_required';
