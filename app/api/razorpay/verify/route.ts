import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Razorpay verification is disabled. Manual UPI payments are verified by an administrator." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
