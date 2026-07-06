import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Razorpay is disabled. Pay with PhonePe / UPI and submit the transaction ID for admin verification." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
