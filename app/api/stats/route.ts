import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [coaches, dojos, bookings, users, products, sellers] = await prisma.$transaction([
      prisma.coach.count(),
      prisma.dojo.count(),
      prisma.booking.count(),
      prisma.user.count(),
      prisma.product.count({ where: { status: "approved" } }),
      prisma.seller.count()
    ]);

    return NextResponse.json(
      { coaches, dojos, bookings, users, products, sellers },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("stats.load_failed", error);
    return NextResponse.json(
      { error: "Could not load PostgreSQL stats. Check DATABASE_URL or POSTGRES_URL in Vercel." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
