-- FitSaathi registrations and coach/dojo bookings are permanently free.
-- Keep historical payment/order records and provider-listed monthly fees
-- intact, but remove every FitSaathi fee/payment-review prerequisite from
-- service bookings and provider registration.

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

UPDATE public.dojos
SET
  "registrationPaymentStatus" = 'not_required';
