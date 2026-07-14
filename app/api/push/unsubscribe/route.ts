import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError } from "@/lib/security";

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (await isRateLimited(`push-unsubscribe:${user.id}:${getClientIp(request)}`, 20, 10 * 60_000)) return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    const { endpoint } = z.object({ endpoint: z.string().url().max(2048) }).parse(await request.json());
    const result = await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint } });
    return NextResponse.json({ removed: result.count > 0 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "Could not disable this subscription." }, { status: 400 });
  }
}
