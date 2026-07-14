import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError } from "@/lib/security";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const input = querySchema.parse(Object.fromEntries(url.searchParams));
    const where = { userId: user.id, ...(input.unread === "true" ? { read: false } : {}) };
    const [items, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * input.limit, take: input.limit, select: { id: true, type: true, title: true, message: true, bookingId: true, actionUrl: true, read: true, readAt: true, createdAt: true } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    return NextResponse.json({ items, total, unreadCount: Math.max(0, unreadCount), page: input.page, limit: input.limit }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid notification query." }, { status: 400 });
    return NextResponse.json({ error: "Could not load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (await isRateLimited(`notifications-read:${user.id}:${getClientIp(request)}`, 60, 60_000)) return NextResponse.json({ error: "Too many notification updates. Please wait." }, { status: 429 });
    const input = z.union([
      z.object({ notificationId: z.string().uuid() }),
      z.object({ all: z.literal(true) }),
    ]).parse(await request.json());
    const now = new Date();
    const result = "all" in input
      ? await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true, readAt: now } })
      : await prisma.notification.updateMany({ where: { id: input.notificationId, userId: user.id }, data: { read: true, readAt: now } });
    if (!("all" in input) && result.count === 0) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    const unreadCount = await prisma.notification.count({ where: { userId: user.id, read: false } });
    return NextResponse.json({ updated: result.count, unreadCount: Math.max(0, unreadCount) });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid notification update." }, { status: 400 });
    return NextResponse.json({ error: "Could not update notifications." }, { status: 500 });
  }
}
