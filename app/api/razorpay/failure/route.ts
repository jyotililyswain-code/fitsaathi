import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Razorpay checkout is disabled. Use manual UPI payment." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
