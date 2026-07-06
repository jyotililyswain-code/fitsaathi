ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'confirmed';

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'upi_manual',
  ADD COLUMN IF NOT EXISTS "upiId" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'pending_verification',
  ADD COLUMN IF NOT EXISTS "paymentScreenshotPath" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

UPDATE "payments"
SET
  "paymentMethod" = CASE
    WHEN "provider" = 'RAZORPAY' THEN 'razorpay'
    ELSE COALESCE(NULLIF("paymentMethod", ''), 'upi_manual')
  END,
  "paymentStatus" = CASE
    WHEN "status" = 'paid' THEN 'paid'
    WHEN "status" IN ('failed', 'rejected', 'refunded') THEN 'rejected'
    ELSE COALESCE(NULLIF("paymentStatus", ''), 'pending_verification')
  END
WHERE "paymentMethod" IS NULL
  OR "paymentStatus" IS NULL
  OR "provider" = 'RAZORPAY';

CREATE UNIQUE INDEX IF NOT EXISTS "payments_transactionId_key" ON "payments"("transactionId") WHERE "transactionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_paymentStatus_createdAt_idx" ON "payments"("paymentStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "payments_verifiedBy_idx" ON "payments"("verifiedBy");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_paymentStatus_check'
  ) THEN
    ALTER TABLE "payments"
      ADD CONSTRAINT "payments_paymentStatus_check"
      CHECK ("paymentStatus" IN ('pending_verification', 'paid', 'rejected'));
  END IF;
END $$;
