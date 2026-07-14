import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { pushSubscriptionSchema } from "@/lib/notifications/validation";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (await isRateLimited(`push-subscribe:${user.id}:${getClientIp(request)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many subscription attempts. Please wait." }, { status: 429 });
    const input = pushSubscriptionSchema.parse(await request.json());
    const endpointHash = crypto.createHash("sha256").update(input.endpoint).digest("hex");
    await prisma.$transaction(async tx => {
      const existing = await tx.pushSubscription.findUnique({ where: { endpoint: input.endpoint }, select: { userId: true } });
      if (existing && existing.userId !== user.id) await tx.pushSubscription.delete({ where: { endpoint: input.endpoint } });
      await tx.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: { endpointHash, p256dh: input.keys.p256dh, auth: input.keys.auth, userAgent: sanitizeText(request.headers.get("user-agent"), 500), deviceName: input.deviceName, browserName: input.browserName, platform: input.platform, isActive: true, failureCount: 0, lastFailureReason: null },
        create: { userId: user.id, endpoint: input.endpoint, endpointHash, p256dh: input.keys.p256dh, auth: input.keys.auth, userAgent: sanitizeText(request.headers.get("user-agent"), 500), deviceName: input.deviceName, browserName: input.browserName, platform: input.platform },
      });
      await tx.user.update({ where: { id: user.id }, data: { notificationOnboardingCompleted: true } });
    });
    return NextResponse.json({ registered: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "The browser subscription is invalid." }, { status: 400 });
  }
}
