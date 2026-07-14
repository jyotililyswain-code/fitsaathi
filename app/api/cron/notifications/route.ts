import { NextResponse } from "next/server";
import { deliverNotification } from "@/lib/notifications/send-push";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const now = new Date();
  const staleClaim = new Date(now.getTime() - 10 * 60_000);
  const due = await prisma.notificationOutbox.findMany({
    where: {
      attemptCount: { lt: 8 },
      OR: [
        { status: "pending" },
        { status: "failed", nextAttemptAt: { lte: now } },
        { status: "processing", lastAttemptAt: { lte: staleClaim } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: { id: true, notificationId: true },
  });
  let claimed = 0;
  let processed = 0;
  for (let index = 0; index < due.length; index += 5) {
    const batch = due.slice(index, index + 5);
    const results = await Promise.allSettled(batch.map(async item => {
      const result = await deliverNotification(item.notificationId);
      if (!result) return null;
      claimed += 1;
      processed += 1;
      return result;
    }));
    if (results.some(result => result.status === "rejected")) console.warn("notification_outbox.batch_partial_failure", { batchSize: batch.length });
  }
  return NextResponse.json({ claimed, processed });
}
