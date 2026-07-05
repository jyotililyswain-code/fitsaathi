ALTER TABLE "User"
  ADD COLUMN "verificationPaymentStatus" "VerificationPaymentStatus" NOT NULL DEFAULT 'unpaid',
  ADD COLUMN "verificationPaidUntil" TIMESTAMP(3);

UPDATE "User" AS u
SET
  "verificationPaymentStatus" = sv."paymentStatus",
  "verificationPaidUntil" = sv."expiresAt"
FROM "SocialVerification" AS sv
WHERE sv."userId" = u."id" AND sv."paymentStatus" = 'paid';

CREATE INDEX "User_verificationPaymentStatus_verificationPaidUntil_idx" ON "User"("verificationPaymentStatus", "verificationPaidUntil");
