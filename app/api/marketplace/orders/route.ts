import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { manualPaymentData } from "@/lib/manual-upi";
import { paymentValue, readPaymentRequest, requireTransactionId, storePaymentScreenshot } from "@/lib/manual-payment-server";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

type RequestedItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await readPaymentRequest(request);
    const transactionId = requireTransactionId(paymentValue(body, "transactionId", 80));
    const requested = parseItems(paymentValue(body, "items", 6000));
    if (!requested.length || requested.length > 30) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

    const products = await prisma.product.findMany({ where: { id: { in: requested.map(item => item.productId) }, status: "approved" }, include: { seller: true } });
    const lineItems = requested.map(item => {
      const product = products.find(candidate => candidate.id === item.productId);
      if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
      if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
      return {
        productId: product.id,
        title: product.title,
        quantity: item.quantity,
        unitPrice: product.customerPrice,
        lineTotal: product.customerPrice * item.quantity,
        unitPayout: product.sellerPayout,
        sellerPayout: product.sellerPayout * item.quantity,
        platformFee: product.platformFee,
        sellerId: product.sellerId,
        sellerOwnerId: product.seller.ownerId
      };
    });
    const total = lineItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const platformRevenue = lineItems.reduce((sum, item) => sum + Number(item.platformFee || 0) * Number(item.quantity || 1), 0);
    const sellerPayout = lineItems.reduce((sum, item) => sum + Number(item.sellerPayout || 0), 0);
    const screenshotPath = await storePaymentScreenshot(body, "paymentScreenshot", "marketplace");

    const order = await prisma.$transaction(async tx => {
      const currentProducts = await tx.product.findMany({ where: { id: { in: requested.map(item => item.productId) } } });
      for (const item of requested) {
        const product = currentProducts.find(candidate => candidate.id === item.productId);
        if (!product || product.stock < item.quantity) throw new Error("STOCK_CHANGED");
      }
      const created = await tx.order.create({
        data: {
          userId: user.id,
          customerName: paymentValue(body, "customerName", 100),
          phoneNumber: paymentValue(body, "phoneNumber", 20),
          shippingAddress: paymentValue(body, "shippingAddress", 500),
          total,
          platformRevenue,
          paymentStatus: "paid",
          status: "confirmed",
          items: {
            create: lineItems.map(item => ({
              productId: String(item.productId),
              sellerId: String(item.sellerId),
              quantity: Number(item.quantity),
              customerPrice: Number(item.unitPrice),
              sellerPayout: Number(item.unitPayout),
              platformFee: Number(item.platformFee || 0)
            }))
          }
        },
        include: { items: true }
      });
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: String(item.productId) },
          data: { stock: { decrement: Number(item.quantity) }, salesCount: { increment: Number(item.quantity) } }
        });
      }
      await tx.payment.create({
        data: {
          userId: user.id,
          orderId: created.id,
          purpose: "marketplace_order",
          targetType: "order",
          targetId: created.id,
          amount: total,
          amountPaise: total * 100,
          currency: "INR",
          originalPrice: total,
          platformFee: platformRevenue,
          sellerPayout,
          lineItems: lineItems as Prisma.InputJsonValue,
          ...manualPaymentData(transactionId, total, screenshotPath || undefined)
        }
      });
      const sellerOwnerIds = Array.from(new Set(lineItems.map(item => item.sellerOwnerId)));
      await tx.notification.createMany({
        data: [
          { userId: user.id, orderId: created.id, type: "payment_success", title: "Order confirmed", message: `Payment submitted successfully. Order #${created.id.slice(0, 8)} is confirmed.` },
          ...sellerOwnerIds.map(ownerId => ({ userId: ownerId, orderId: created.id, type: "marketplace_order", title: "New confirmed order", message: `Order #${created.id.slice(0, 8)} is ready to process.` }))
        ]
      });
      return created;
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "TRANSACTION_ID_REQUIRED") return NextResponse.json({ error: "Enter your UPI transaction ID / reference ID." }, { status: 400 });
    if (error instanceof Error && error.message === "PRODUCT_NOT_AVAILABLE") return NextResponse.json({ error: "A cart product is no longer available." }, { status: 409 });
    if (error instanceof Error && ["INSUFFICIENT_STOCK", "STOCK_CHANGED"].includes(error.message)) return NextResponse.json({ error: "Product stock changed before order completion." }, { status: 409 });
    if (error instanceof Error && error.message === "INVALID_PAYMENT_SCREENSHOT") return NextResponse.json({ error: "Upload a PNG, JPG, or WEBP payment screenshot." }, { status: 400 });
    if (error instanceof Error && error.message === "PAYMENT_SCREENSHOT_TOO_LARGE") return NextResponse.json({ error: "Payment screenshot must be under 5 MB." }, { status: 400 });
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "This UPI transaction ID is already used." }, { status: 409 });
    console.error("marketplace.order_create_failed", error);
    return NextResponse.json({ error: "Could not create marketplace order." }, { status: 500 });
  }
}

function parseItems(value: string): RequestedItem[] {
  try {
    const raw = JSON.parse(value);
    if (!Array.isArray(raw)) return [];
    return raw.map(item => ({
      productId: String(item?.productId || "").trim(),
      quantity: Math.max(1, Math.min(10, Math.round(Number(item?.quantity) || 1)))
    })).filter(item => item.productId);
  } catch {
    return [];
  }
}
