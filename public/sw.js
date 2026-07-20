const FALLBACK_URL = "/dashboard";
const ALLOWED_PATHS = ["/dashboard", "/coach-dashboard", "/dojo-dashboard", "/seller-dashboard", "/orders"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === "string" && data.title.trim() ? data.title.slice(0, 100) : "FitSaathi update";
  const body = typeof data.body === "string" && data.body.trim() ? data.body.slice(0, 180) : "Open FitSaathi to view your latest update.";
  const actionUrl = safeAction(data.actionUrl);
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag: typeof data.tag === "string" ? data.tag.slice(0, 160) : "fitsaathi-update",
    data: { actionUrl, notificationId: data.notificationId, bookingId: data.bookingId },
    renotify: data.type === "booking_created",
    timestamp: Number.isFinite(Date.parse(data.timestamp)) ? Date.parse(data.timestamp) : Date.now(),
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const actionUrl = safeAction(event.notification.data?.actionUrl);
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async windows => {
    const target = new URL(actionUrl, self.location.origin).href;
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      if ("navigate" in client) await client.navigate(target);
      return client.focus();
    }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener("notificationclose", () => undefined);

function safeAction(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return FALLBACK_URL;
  let url;
  try { url = new URL(value, self.location.origin); } catch { return FALLBACK_URL; }
  if (url.origin !== self.location.origin || !ALLOWED_PATHS.some(prefix => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) return FALLBACK_URL;
  return `${url.pathname}${url.search}${url.hash}`;
}
