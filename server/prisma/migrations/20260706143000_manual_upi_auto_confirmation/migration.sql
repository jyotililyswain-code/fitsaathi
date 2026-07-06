ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "amountPaid" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "payments"
  ALTER COLUMN "paymentStatus" SET DEFAULT 'paid';

UPDATE "payments"
SET
  "status" = 'paid',
  "paymentStatus" = 'paid',
  "amountPaid" = "amount",
  "paidAt" = COALESCE("paidAt", CURRENT_TIMESTAMP),
  "paymentMethod" = 'upi_manual',
  "upiId" = COALESCE("upiId", '7065223868-2@ibl')
WHERE "paymentMethod" = 'upi_manual'
  AND "paymentStatus" = 'pending_verification';

UPDATE "payments"
SET "amountPaid" = "amount"
WHERE "paymentStatus" = 'paid'
  AND "amountPaid" = 0;

UPDATE "bookings" AS booking
SET "paymentStatus" = 'paid', "status" = 'confirmed', "contactVisible" = TRUE
FROM "payments" AS payment
WHERE payment."bookingId" = booking."id"
  AND payment."paymentMethod" = 'upi_manual'
  AND payment."paymentStatus" = 'paid';

UPDATE "orders" AS customer_order
SET "paymentStatus" = 'paid', "status" = 'confirmed'
FROM "payments" AS payment
WHERE payment."orderId" = customer_order."id"
  AND payment."paymentMethod" = 'upi_manual'
  AND payment."paymentStatus" = 'paid';

UPDATE "dojos" AS dojo
SET "registrationPaymentStatus" = 'paid'
FROM "payments" AS payment
WHERE payment."targetType" = 'dojo'
  AND payment."targetId" = dojo."id"
  AND payment."purpose" = 'dojo_registration'
  AND payment."paymentMethod" = 'upi_manual'
  AND payment."paymentStatus" = 'paid';
