import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/notifications/send-push";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError } from "@/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (await isRateLimited(`push-test:${user.id}:${getClientIp(request)}`, 3, 10 * 60_000)) return NextResponse.json({ error: "Test notifications are limited. Please wait before trying again." }, { status: 429 });
    const result = await sendPushToUser(user.id, {
      notificationId: `test-${Date.now()}`,
      type: "notification_test",
      title: "TheFitSaathi notifications are working",
      body: "You will receive alerts here when a new booking arrives.",
      actionUrl: user.role === "coach" ? "/coach-dashboard" : user.role === "dojo" ? "/dojo-dashboard" : "/dashboard",
      tag: `notification-test-${user.id}`,
      timestamp: new Date().toISOString(),
    });
    if (!result.configured) return NextResponse.json({ error: "Push delivery is not configured on the server." }, { status: 503 });
    if (result.noSubscription) return NextResponse.json({ error: "No active browser subscription was found for this account." }, { status: 409 });
    if (!result.succeeded) return NextResponse.json({ error: "The test notification could not be delivered." }, { status: 502 });
    return NextResponse.json({ attempted: result.attempted, delivered: result.succeeded });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "Could not send the test notification." }, { status: 500 });
  }
}
