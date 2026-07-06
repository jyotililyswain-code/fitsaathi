import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Razorpay webhooks are disabled. Payments are verified manually." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
