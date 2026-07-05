export const DEFAULT_PLATFORM_FEE = 700;
export const DOJO_REGISTRATION_FEE = 700;
export const COACH_INCENTIVE_BONUS = 100;

export type PriceBreakdown = {
  originalPrice: number;
  platformFee: number;
  totalPrice: number;
  finalPrice: number;
  coachPayout: number;
};

export function getPriceBreakdown(originalPrice: number, platformFee = DEFAULT_PLATFORM_FEE): PriceBreakdown {
  const safeOriginalPrice = clampMoney(originalPrice);
  const safePlatformFee = clampMoney(platformFee);

  const total = safeOriginalPrice + safePlatformFee;
  return {
    originalPrice: safeOriginalPrice,
    platformFee: safePlatformFee,
    totalPrice: total,
    finalPrice: total,
    coachPayout: safeOriginalPrice + COACH_INCENTIVE_BONUS
  };
}

export function getCoachCustomerPrice(coach: { customer_price?: number; customerPrice?: number; finalPrice?: number; totalPrice?: number; base_fee?: number; baseFee?: number; originalPrice?: number; price?: number } | null | undefined) {
  if (!coach) return 0;
  const storedFinal = Number(coach.customer_price ?? coach.customerPrice ?? coach.finalPrice ?? coach.totalPrice);
  if (Number.isFinite(storedFinal) && storedFinal > 0) return clampMoney(storedFinal);
  return getPriceBreakdown(Number(coach.base_fee ?? coach.baseFee ?? coach.originalPrice ?? coach.price ?? 0)).finalPrice;
}

export function getCoachBaseFee(coach: { base_fee?: number; baseFee?: number; originalPrice?: number; price?: number } | null | undefined) {
  return clampMoney(Number(coach?.base_fee ?? coach?.baseFee ?? coach?.originalPrice ?? coach?.price ?? 0));
}

export function toPaise(amountInRupees: number) {
  return Math.round(clampMoney(amountInRupees) * 100);
}

export function clampMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}
