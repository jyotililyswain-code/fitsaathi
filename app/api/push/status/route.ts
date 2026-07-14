import { NextResponse } from "next/server";
import { z } from "zod";
import { webPushConfiguration } from "@/lib/notifications/web-push";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const endpointHash = z.string().regex(/^[a-f0-9]{64}$/).optional().parse(new URL(request.url).searchParams.get("endpointHash") || undefined);
    const [activeSubscriptions, deviceRegistered] = await Promise.all([
      prisma.pushSubscription.count({ where: { userId: user.id, isActive: true } }),
      endpointHash ? prisma.pushSubscription.count({ where: { userId: user.id, endpointHash, isActive: true } }).then(count => count > 0) : Promise.resolve(false),
    ]);
    return NextResponse.json({ deviceRegistered, activeSubscriptions, serverConfigured: webPushConfiguration().available }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not check notification status." }, { status: 400 });
  }
}
