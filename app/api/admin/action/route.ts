import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canDelete, canManageFinance, canManageOrders, canManageUsers, canModerateMarketplace, isAdminRole, type AdminRole } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError, sanitizeText } from "@/lib/security";
import { dojoModerationData } from "@/lib/dojo-visibility";
import { removeUploads } from "@/server/src/uploads";
import { removeProviderUploads } from "@/server/src/provider-uploads";

type ActionBody = { action?: unknown; targetId?: unknown; value?: unknown; reason?: unknown; settings?: unknown };

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser(request);
    if (!isAdminRole(actor.role)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    if (await isRateLimited(`admin-action:${actor.id}:${getClientIp(request)}`, 60, 60_000)) return NextResponse.json({ error: "Too many admin actions." }, { status: 429 });
    const role = actor.role as AdminRole;
    const body = (await request.json()) as ActionBody;
    const action = sanitizeText(body.action, 60);
    const targetId = sanitizeText(body.targetId, 120);
    const value = sanitizeText(body.value, 60);
    const reason = sanitizeText(body.reason, 500);
    if (!action || !targetId) return NextResponse.json({ error: "Action and target are required." }, { status: 400 });
    let details: Record<string, unknown> = { targetId, value, reason };

    if (action === "seller_status") {
      if (!canModerateMarketplace(role) || !["verified", "trusted", "rejected", "suspended"].includes(value)) return NextResponse.json({ error: "Marketplace moderation permission required." }, { status: 403 });
      await prisma.seller.update({ where: { id: targetId }, data: { status: value as any, verified: ["verified", "trusted"].includes(value), trusted: value === "trusted" } });
    } else if (action === "provider_status") {
      if (!canModerateMarketplace(role) || !["active", "inactive", "suspended"].includes(value)) return NextResponse.json({ error: "Provider moderation permission required." }, { status: 403 });
      const status = value as "active" | "inactive" | "suspended";
      const dojo = await prisma.dojo.update({ where: { id: targetId }, data: dojoModerationData(status) });
      console.info("dojo.operational_status_updated", { profileId: dojo.id, status: dojo.status, visible: dojo.status === "active" && dojo.approved });
    } else if (action === "dojo_verification") {
      if (!canModerateMarketplace(role) || !["verified", "unverified"].includes(value)) return NextResponse.json({ error: "Provider verification permission required." }, { status: 403 });
      const verified = value === "verified";
      const [dojo] = await prisma.$transaction([
        prisma.dojo.update({ where: { id: targetId }, data: { verified } }),
        prisma.providerVerification.updateMany({ where: { profileType: "dojo", profileId: targetId }, data: { status: verified ? "approved" : "pending", reviewedById: actor.id, reviewedAt: new Date() } })
      ]);
      console.info("dojo.verification_updated", { profileId: dojo.id, verified });
    } else if (action === "product_status") {
      if (!canModerateMarketplace(role) || !["approved", "rejected", "featured", "trending"].includes(value)) return NextResponse.json({ error: "Marketplace moderation permission required." }, { status: 403 });
      await prisma.product.update({ where: { id: targetId }, data: { status: ["featured", "trending"].includes(value) ? "approved" : value as any, featured: value === "featured", trending: value === "trending" } });
    } else if (action === "order_status") {
      if (!canManageOrders(role) || !["pending", "confirmed", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(value)) return NextResponse.json({ error: "Order management permission required." }, { status: 403 });
      if (value === "refunded" && !canManageFinance(role)) return NextResponse.json({ error: "Finance permission required." }, { status: 403 });
      await prisma.order.update({ where: { id: targetId }, data: { status: value as any } });
    } else if (action === "user_status") {
      if (!canManageUsers(role) || !["active", "banned"].includes(value) || targetId === actor.id) return NextResponse.json({ error: "User management permission required." }, { status: 403 });
      await prisma.user.update({ where: { id: targetId }, data: { accountStatus: value } });
      if (value === "banned") await prisma.refreshToken.deleteMany({ where: { userId: targetId } });
    } else if (action === "report_status") {
      await prisma.report.update({ where: { id: targetId }, data: { status: value || "resolved", resolvedById: actor.id, resolution: reason } });
    } else if (action === "delete_product") {
      if (!canDelete(role)) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      const product = await prisma.product.findUnique({ where: { id: targetId }, include: { images: true } });
      if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      await prisma.product.delete({ where: { id: product.id } });
      removeUploads(product.images.flatMap(image => [image.path, image.thumbnail]));
    } else if (action === "delete_seller") {
      if (!canDelete(role)) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      const seller = await prisma.seller.findUnique({ where: { id: targetId }, include: { products: { include: { images: true } } } });
      if (!seller) return NextResponse.json({ error: "Seller not found." }, { status: 404 });
      await prisma.seller.delete({ where: { id: seller.id } });
      removeUploads([
        seller.profilePath,
        seller.aadhaarPath,
        ...seller.products.flatMap(product => product.images.flatMap(image => [image.path, image.thumbnail])),
      ]);
    } else if (action === "delete_dojo") {
      if (!canDelete(role)) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      const dojo = await prisma.dojo.findUnique({ where: { id: targetId }, select: { id: true, imagePath: true } });
      if (!dojo) return NextResponse.json({ error: "Dojo registration not found." }, { status: 404 });
      const verification = await prisma.providerVerification.findUnique({ where: { profileType_profileId: { profileType: "dojo", profileId: dojo.id } }, select: { certificatePath: true, aadhaarFrontPath: true, aadhaarBackPath: true } });
      await prisma.$transaction([prisma.providerVerification.deleteMany({ where: { profileType: "dojo", profileId: dojo.id } }), prisma.dojo.delete({ where: { id: dojo.id } })]);
      const storedPaths = [dojo.imagePath, verification?.certificatePath, verification?.aadhaarFrontPath, verification?.aadhaarBackPath];
      await removeProviderUploads(storedPaths);
      removeUploads(storedPaths);
    } else if (action === "delete_user") {
      if (!canDelete(role) || targetId === actor.id) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      await prisma.user.delete({ where: { id: targetId } });
    } else if (action === "platform_settings") {
      if (!canManageFinance(role)) return NextResponse.json({ error: "Platform settings permission required." }, { status: 403 });
      const submitted = body.settings && typeof body.settings === "object" ? body.settings as Record<string, unknown> : {};
      const settings = { commissionPercent: Math.min(50, Math.max(0, Number(submitted.commissionPercent) || 0)), highValueOrderThreshold: Math.min(10_000_000, Math.max(0, Number(submitted.highValueOrderThreshold) || 0)), maintenanceMode: submitted.maintenanceMode === true, manualSellerVerification: submitted.manualSellerVerification !== false, updatedById: actor.id };
      await prisma.platformSettings.upsert({ where: { id: targetId }, update: settings, create: { id: targetId, ...settings } });
      details = { targetId, settings };
    } else if (action === "notification_read") {
      await prisma.notification.updateMany({ where: { id: targetId }, data: { read: true } });
    } else return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });

    await prisma.adminLog.create({ data: { actorId: actor.id, action, targetId, details: details as Prisma.InputJsonValue, ip: getClientIp(request) } });
    return NextResponse.json({ ok: true, action, targetId });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    console.error("admin.action_failed", error);
    return NextResponse.json({ error: "Admin action failed." }, { status: 500 });
  }
}
