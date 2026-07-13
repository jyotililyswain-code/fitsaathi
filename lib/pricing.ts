export const DEFAULT_PLATFORM_FEE = 0;
export const BOOKING_FEE = 0;
export const DOJO_REGISTRATION_FEE = 0;
export const COACH_INCENTIVE_BONUS = 0;

export type PriceBreakdown = {
  originalPrice: number;
  platformFee: number;
  totalPrice: number;
  finalPrice: number;
  coachPayout: number;
};

export function getPriceBreakdown(originalPrice: number, platformFee = DEFAULT_PLATFORM_FEE): PriceBreakdown {
  void originalPrice;
  void platformFee;
  return {
    originalPrice: 0,
    platformFee: 0,
    totalPrice: 0,
    finalPrice: 0,
    coachPayout: 0
  };
}

export function getCoachCustomerPrice(coach: { customer_price?: number; customerPrice?: number; finalPrice?: number; totalPrice?: number; base_fee?: number; baseFee?: number; originalPrice?: number; price?: number } | null | undefined) {
  void coach;
  return 0;
}

export function getCoachBaseFee(coach: { base_fee?: number; baseFee?: number; originalPrice?: number; price?: number } | null | undefined) {
  void coach;
  return 0;
}

export function toPaise(amountInRupees: number) {
  return Math.round(clampMoney(amountInRupees) * 100);
}

export function clampMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}
