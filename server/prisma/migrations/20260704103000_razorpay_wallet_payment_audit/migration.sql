ALTER TABLE "WalletTransaction"
  ADD COLUMN "purpose" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'success',
  ADD COLUMN "razorpayOrderId" TEXT,
  ADD COLUMN "razorpayPaymentId" TEXT,
  ADD COLUMN "razorpaySignature" TEXT,
  ADD COLUMN "creditedAt" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "WalletTransaction"
SET
  "purpose" = CASE
    WHEN "type" = 'recharge' THEN 'WALLET_RECHARGE'
    WHEN "type" = 'chat_fee' OR "type" = 'connection_fee' THEN 'CHAT_CHARGE'
    WHEN "type" = 'verification_fee' THEN 'VERIFICATION_PAYMENT'
    WHEN "type" = 'refund' THEN 'REFUND'
    WHEN "type" = 'admin_adjustment' OR "type" = 'adjustment' THEN 'ADMIN_ADJUSTMENT'
    ELSE UPPER("type"::text)
  END,
  "creditedAt" = CASE WHEN "amountPaise" > 0 THEN "createdAt" ELSE NULL END;

CREATE INDEX "WalletTransaction_razorpayOrderId_idx" ON "WalletTransaction"("razorpayOrderId");
CREATE INDEX "WalletTransaction_razorpayPaymentId_idx" ON "WalletTransaction"("razorpayPaymentId");
CREATE INDEX "WalletTransaction_status_createdAt_idx" ON "WalletTransaction"("status", "createdAt");

ALTER TABLE "Payment"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
  ADD COLUMN "providerOrderId" TEXT,
  ADD COLUMN "providerPaymentId" TEXT;

UPDATE "Payment"
SET
  "providerOrderId" = "razorpayOrderId",
  "providerPaymentId" = "razorpayPaymentId";

CREATE TABLE "RazorpayWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "paymentId" TEXT,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RazorpayWebhookEvent_eventId_key" ON "RazorpayWebhookEvent"("eventId");
CREATE INDEX "RazorpayWebhookEvent_event_createdAt_idx" ON "RazorpayWebhookEvent"("event", "createdAt");
CREATE INDEX "RazorpayWebhookEvent_paymentId_idx" ON "RazorpayWebhookEvent"("paymentId");
