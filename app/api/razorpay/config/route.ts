import { NextResponse } from "next/server";

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const configured = Boolean(keyId && publicKey && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);
  const keysMatch = Boolean(keyId && publicKey && keyId === publicKey);
  return NextResponse.json({
    configured,
    keysMatch,
    mode: keyId.startsWith("rzp_live_") ? "live" : keyId.startsWith("rzp_test_") ? "test" : "unconfigured",
    webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET)
  }, { status: configured && keysMatch ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
