-- Add yearly verification payment state without invalidating existing approved users.
CREATE TYPE "VerificationPaymentStatus" AS ENUM ('unpaid', 'paid', 'expired');

ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'chat_fee';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'verification_fee';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'admin_adjustment';

ALTER TABLE "SocialVerification"
  ADD COLUMN "governmentIdBackEncrypted" TEXT,
  ADD COLUMN "paymentStatus" "VerificationPaymentStatus" NOT NULL DEFAULT 'unpaid',
  ADD COLUMN "paymentId" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "SocialVerification"
SET
  "paymentStatus" = 'paid',
  "paidAt" = COALESCE("reviewedAt", "updatedAt", CURRENT_TIMESTAMP),
  "expiresAt" = COALESCE("reviewedAt", "updatedAt", CURRENT_TIMESTAMP) + INTERVAL '1 year'
WHERE "status" = 'approved';

CREATE INDEX "SocialVerification_paymentStatus_expiresAt_idx" ON "SocialVerification"("paymentStatus", "expiresAt");
