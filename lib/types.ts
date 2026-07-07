export type Badge = "verified" | "elite" | "legendary" | "none";

export type AttendanceRisk = "green" | "yellow" | "red" | "unknown";

export type Coach = {
  id: string;
  ownerId?: string;
  name: string;
  category: string;
  city?: string;
  price?: number;
  originalPrice?: number;
  platformFee?: number;
  totalPrice?: number;
  finalPrice?: number;
  base_fee?: number;
  customer_price?: number;
  coach_payout?: number;
  baseFee?: number;
  customerPrice?: number;
  coachPayout?: number;
  rating?: number;
  badge?: Badge;
  attendancePercent?: number;
  cancellations?: number;
  photoUrl?: string;
  bio?: string;
  verified?: boolean;
  status?: "pending" | "approved" | "rejected" | "suspended";
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  availableDays?: string[];
  availableTimings?: string[];
};

export type Dojo = {
  id: string;
  name: string;
  category: string;
  city?: string;
  price?: number;
  originalPrice?: number;
  platformFee?: number;
  totalPrice?: number;
  finalPrice?: number;
  rating?: number;
  imageUrl?: string;
  description?: string;
  approved?: boolean;
  ownerName?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  registrationPaymentStatus?: "pending" | "paid" | "rejected" | "failed";
};

export type Booking = {
  id: string;
  userId?: string;
  coachId?: string;
  dojoId?: string;
  coachOwnerId?: string;
  providerOwnerId?: string;
  status?: string;
  amount?: number;
  originalPrice?: number;
  platformFee?: number;
  totalPrice?: number;
  finalPrice?: number;
  paymentStatus?: "pending" | "paid" | "rejected" | "failed" | "refunded";
  payoutStatus?: "not_due" | "pending" | "processed" | "held";
  payoutAmount?: number;
  payoutMonth?: string;
  commissionAmount?: number;
  coachPayout?: number;
  preferredDate?: string;
  preferredTime?: string;
  classType?: string;
  customerName?: string;
  customerPhone?: string;
  providerPhone?: string;
};

export type Review = {
  id: string;
  targetId?: string;
  rating?: number;
  comment?: string;
};

export type PlatformStats = {
  coaches: number;
  dojos: number;
  sellers: number;
  bookings: number;
  users: number;
};

export type Payment = {
  id: string;
  userId?: string;
  bookingId?: string;
  orderId?: string;
  purpose?: "booking" | "dojo_registration" | "marketplace_order" | "WALLET_RECHARGE" | "YEARLY_VERIFICATION" | "premium";
  paymentMethod?: "upi_manual";
  upiId?: string;
  transactionId?: string;
  paymentStatus?: "paid" | "rejected";
  paymentScreenshotPath?: string;
  amount?: number;
  amountPaid?: number;
  status?: "created" | "paid" | "rejected" | "failed" | "refunded";
  paidAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  refundId?: string;
  failureReason?: string;
  createdAt?: string;
};

export type Attendance = {
  id: string;
  bookingId: string;
  coachId: string;
  customerId: string;
  scannedAt?: string;
  location?: string;
  attendanceStatus: "marked" | "rejected";
};
