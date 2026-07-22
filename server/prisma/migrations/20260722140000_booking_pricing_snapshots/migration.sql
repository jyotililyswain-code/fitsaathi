-- Preserve the provider's monthly training-fee calculation at confirmation.
-- Values are integer paise so odd rupee fees can be split without floating
-- point drift. Existing bookings remain nullable and are resolved read-only.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS "monthlyFeeSnapshotPaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "firstMonthPaymentPaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "firstMonthRemainingBalancePaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "continuationPaymentPaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "pricingCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "pricingPolicyVersion" TEXT;
