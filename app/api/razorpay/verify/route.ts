import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This legacy verification endpoint is disabled. Use the PhonePe / UPI payment form." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
