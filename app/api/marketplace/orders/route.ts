import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const razorpayOrderId = sanitizeText(body.razorpayOrderId, 100);
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
    const lineItems = Array.isArray(payment?.lineItems) ? payment.lineItems as Array<any> : [];
    if (!payment || payment.userId !== user.id || payment.status !== "paid" || payment.purpose !== "marketplace_order" || !lineItems.length) return NextResponse.json({ error: "Verified marketplace payment not found." }, { status: 409 });
    if (payment.orderId) return NextResponse.json({ error: "This payment already has an order." }, { status: 409 });

    const order = await prisma.$transaction(async tx => {
      const products = await tx.product.findMany({ where: { id: { in: lineItems.map(item => String(item.productId)) } } });
      for (const item of lineItems) {
        const product = products.find(candidate => candidate.id === item.productId);
        if (!product || product.stock < Number(item.quantity)) throw new Error("STOCK_CHANGED");
      }
      const created = await tx.order.create({ data: {
        userId: user.id, customerName: sanitizeText(body.customerName, 100), phoneNumber: sanitizeText(body.phoneNumber, 20), shippingAddress: sanitizeText(body.shippingAddress, 500), total: payment.amount, platformRevenue: lineItems.reduce((sum, item) => sum + Number(item.platformFee || 0) * Number(item.quantity || 1), 0), paymentStatus: "paid", status: "paid",
        items: { create: lineItems.map(item => ({ productId: String(item.productId), sellerId: String(item.sellerId), quantity: Number(item.quantity), customerPrice: Number(item.unitPrice), sellerPayout: Number(item.unitPayout), platformFee: Number(item.platformFee || 0) })) }
      }, include: { items: true } });
      for (const item of lineItems) await tx.product.update({ where: { id: String(item.productId) }, data: { stock: { decrement: Number(item.quantity) }, salesCount: { increment: Number(item.quantity) } } });
      await tx.payment.update({ where: { id: payment.id }, data: { orderId: created.id } });
      const sellerOwners = await tx.seller.findMany({ where: { id: { in: Array.from(new Set(lineItems.map(item => String(item.sellerId)))) } }, select: { ownerId: true } });
      if (sellerOwners.length) await tx.notification.createMany({ data: sellerOwners.map(seller => ({ userId: seller.ownerId, orderId: created.id, type: "marketplace_order", title: "New product order", message: `New paid order ${created.id.slice(0, 8)} is ready to process.` })) });
      return created;
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "STOCK_CHANGED") return NextResponse.json({ error: "Product stock changed before order completion. Contact support for payment review." }, { status: 409 });
    console.error("marketplace.order_create_failed", error);
    return NextResponse.json({ error: "Could not create marketplace order." }, { status: 500 });
  }
}
