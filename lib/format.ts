import type { AttendanceRisk, Badge } from "@/lib/types";

export const categories = [
  "Yoga",
  "MMA",
  "Karate",
  "Boxing",
  "Gymnastics",
  "Kalaripayattu",
  "Calisthenics",
  "Personal Training"
];

export function formatMoney(value?: number) {
  if (typeof value !== "number") return "Price not set";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function getAttendanceRisk(percent?: number): AttendanceRisk {
  if (typeof percent !== "number") return "unknown";
  if (percent >= 92) return "green";
  if (percent >= 80) return "yellow";
  return "red";
}

export function badgeLabel(badge?: Badge) {
  if (!badge || badge === "none") return "No badge";
  return badge[0].toUpperCase() + badge.slice(1);
}
