export const BOOKING_PRICING_CURRENCY = "INR";
export const BOOKING_PRICING_POLICY_VERSION = "first-month-half-v1";

export type BookingPricingSnapshot = {
  monthlyFeePaise: number;
  firstMonthPaymentPaise: number;
  firstMonthRemainingBalancePaise: number;
  continuationPaymentPaise: number;
  pricingCurrency: string;
  pricingPolicyVersion: string;
};

type ProviderPricingFields = {
  baseFee?: number | null;
  customerPrice?: number | null;
  originalPrice?: number | null;
  finalPrice?: number | null;
};

/**
 * Provider prices are stored as integer rupees in the existing schema.
 * Coaches use baseFee; dojos use originalPrice. Their derived customer-price
 * fields are only fallbacks for older rows where the base field is empty.
 */
export function resolveMonthlyFeeRupees(provider: ProviderPricingFields | null | undefined, providerType?: "coach" | "dojo") {
  if (!provider) return null;
  const candidates = providerType === "dojo"
    ? [provider.originalPrice, provider.finalPrice]
    : providerType === "coach"
      ? [provider.baseFee, provider.customerPrice]
      : [provider.baseFee, provider.originalPrice, provider.customerPrice, provider.finalPrice];
  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) return Math.round(amount);
  }
  return null;
}

export function calculateBookingPricing(monthlyFeeRupees: number | null | undefined): BookingPricingSnapshot | null {
  const normalizedRupees = Number(monthlyFeeRupees);
  if (!Number.isFinite(normalizedRupees) || normalizedRupees <= 0) return null;
  const monthlyFeePaise = Math.round(normalizedRupees * 100);
  const firstMonthPaymentPaise = Math.round(monthlyFeePaise / 2);
  const firstMonthRemainingBalancePaise = monthlyFeePaise - firstMonthPaymentPaise;
  return {
    monthlyFeePaise,
    firstMonthPaymentPaise,
    firstMonthRemainingBalancePaise,
    continuationPaymentPaise: firstMonthRemainingBalancePaise + monthlyFeePaise,
    pricingCurrency: BOOKING_PRICING_CURRENCY,
    pricingPolicyVersion: BOOKING_PRICING_POLICY_VERSION,
  };
}

export function formatBookingMoney(paise: number | null | undefined) {
  const amount = Number(paise);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: BOOKING_PRICING_CURRENCY, maximumFractionDigits: 2 }).format(amount / 100);
}
