import { NextResponse } from "next/server";
import { MANUAL_UPI_ID } from "@/lib/manual-upi";

export async function GET() {
  return NextResponse.json({
    configured: true,
    enabled: false,
    mode: "manual_upi",
    upiId: MANUAL_UPI_ID
  }, { headers: { "Cache-Control": "no-store" } });
}
