import Razorpay from "razorpay";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { DOJO_REGISTRATION_FEE, getPriceBreakdown, toPaise } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

type OrderBody = { purpose?: unknown; targetType?: unknown; targetId?: unknown; receipt?: unknown; amount?: unknown; plan?: unknown; items?: Array<{ productId?: unknown; quantity?: unknown }> };

export async function POST(request: Request) {
  if (await isRateLimited(`razorpay:${getClientIp(request)}`, 10, 60_000)) return NextResponse.json({ error: "Too many payment attempts. Please try again shortly." }, { status: 429 });
  try {
    const user = await requireApiUser(request);
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) return NextResponse.json({ error: "Razorpay credentials are not configured." }, { status: 500 });

    const body = (await request.json()) as OrderBody;
    const purpose = sanitizeText(body.purpose, 30);
    const targetType = sanitizeText(body.targetType, 10);
    const targetId = sanitizeText(body.targetId, 100);
    let breakdown;
    let marketplaceItems: Array<Record<string, unknown>> = [];

    if (purpose === "dojo_registration") {
      breakdown = getPriceBreakdown(DOJO_REGISTRATION_FEE, 0);
    } else if (purpose === "verification_fee") {
      breakdown = getPriceBreakdown(300, 0);
    } else if (purpose === "booking" && ["coach", "dojo"].includes(targetType) && targetId) {
      const coach = targetType === "coach" ? await prisma.coach.findUnique({ where: { id: targetId } }) : null;
      const dojo = targetType === "dojo" ? await prisma.dojo.findUnique({ where: { id: targetId } }) : null;
      if (!coach && !dojo) return NextResponse.json({ error: "The selected provider was not found." }, { status: 404 });
      if (coach && !coach.verified) return NextResponse.json({ error: "This coach is not available for booking." }, { status: 409 });
      if (dojo && !dojo.approved) return NextResponse.json({ error: "This dojo is not available for booking." }, { status: 409 });
      breakdown = getPriceBreakdown(coach?.baseFee ?? dojo!.originalPrice, coach?.platformFee ?? dojo!.platformFee);
    } else if (purpose === "wallet_recharge") {
      const amount = Math.round(Number(body.amount));
      if (!Number.isFinite(amount) || amount < 100 || amount > 100000) return NextResponse.json({ error: "Wallet recharge must be between ₹100 and ₹1,00,000." }, { status: 400 });
      breakdown = getPriceBreakdown(amount, 0);
    } else if (purpose === "premium") {
      const plan = sanitizeText(body.plan, 20);
      const amount = plan === "monthly" ? 199 : plan === "quarterly" ? 499 : plan === "annual" ? 1499 : 0;
      if (!amount) return NextResponse.json({ error: "Choose a valid Premium plan." }, { status: 400 });
      breakdown = getPriceBreakdown(amount, 0);
    } else if (purpose === "marketplace_order" && Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 30) {
      const requested = body.items.map(item => ({ productId: sanitizeText(item.productId, 100), quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)) })).filter(item => item.productId);
      const products = await prisma.product.findMany({ where: { id: { in: requested.map(item => item.productId) }, status: "approved" }, include: { seller: true } });
      marketplaceItems = requested.map(item => {
        const product = products.find(candidate => candidate.id === item.productId);
        if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
        if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
        return { productId: product.id, title: product.title, quantity: item.quantity, unitPrice: product.customerPrice, lineTotal: product.customerPrice * item.quantity, unitPayout: product.sellerPayout, sellerPayout: product.sellerPayout * item.quantity, platformFee: product.platformFee, sellerId: product.sellerId, sellerOwnerId: product.seller.ownerId };
      });
      breakdown = getPriceBreakdown(marketplaceItems.reduce((sum, item) => sum + Number(item.lineTotal), 0), 0);
    } else return NextResponse.json({ error: "A valid payment purpose is required." }, { status: 400 });

    const currency = process.env.RAZORPAY_CURRENCY || "INR";
    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({ amount: toPaise(breakdown.finalPrice), currency, receipt: sanitizeText(body.receipt, 40) || `fitsaathi_${Date.now()}`, notes: { userId: user.id, purpose, targetType, targetId } });
    await prisma.payment.create({ data: { userId: user.id, purpose, targetType, targetId, amount: breakdown.finalPrice, amountPaise: Number(order.amount), currency, provider: "RAZORPAY", originalPrice: breakdown.originalPrice, platformFee: breakdown.platformFee, coachPayout: targetType === "coach" ? breakdown.coachPayout : breakdown.originalPrice, sellerPayout: purpose === "marketplace_order" ? marketplaceItems.reduce((sum, item) => sum + Number(item.sellerPayout), 0) : 0, lineItems: marketplaceItems as Prisma.InputJsonValue, razorpayOrderId: order.id, providerOrderId: order.id, status: "created" } });
    return NextResponse.json({ id: order.id, razorpayKeyId: key_id, amount: order.amount, currency: order.currency, finalPrice: breakdown.finalPrice }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "PRODUCT_NOT_AVAILABLE") return NextResponse.json({ error: "A cart product is no longer available." }, { status: 409 });
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "A cart product does not have enough stock." }, { status: 409 });
    console.error("razorpay.order_failed", error);
    return NextResponse.json({ error: "Could not create the payment order." }, { status: 500 });
  }
}
