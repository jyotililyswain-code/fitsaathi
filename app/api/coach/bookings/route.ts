import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const bookings = await prisma.booking.findMany({ where: { providerOwnerId: user.id }, include: { coach: true, dojo: true, attendance: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ bookings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not load provider bookings." }, { status: 500 });
  }
}
