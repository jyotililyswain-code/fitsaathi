import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This legacy webhook endpoint is disabled. PhonePe / UPI payments are recorded directly." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
