import type { DojoImageFit, DojoImagePosition } from "@/lib/dojo-image";

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
  status?: "pending" | "approved" | "active" | "inactive" | "rejected" | "suspended";
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  availableDays?: string[];
  availableTimings?: string[];
};

export type Dojo = {
  id: string;
  name: string;
  category: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  price?: number;
  originalPrice?: number;
  platformFee?: number;
  totalPrice?: number;
  finalPrice?: number;
  rating?: number;
  imageUrl?: string;
  imageFit?: DojoImageFit;
  imagePosition?: DojoImagePosition;
  description?: string;
  approved?: boolean;
  verified?: boolean;
  ownerName?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  approvalStatus?: "pending" | "approved" | "active" | "inactive" | "rejected" | "suspended";
  registrationPaymentStatus?: "not_required";
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
  paymentStatus?: "not_required" | "pending" | "paid" | "rejected" | "failed" | "refunded";
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
  purpose?: "marketplace_order";
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
