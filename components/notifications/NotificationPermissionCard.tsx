"use client";

import { BellRing, BellOff, Send, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { localApi } from "@/lib/local-api";

type Status = "checking" | "unsupported" | "insecure" | "service_worker_unavailable" | "vapid_unavailable" | "denied" | "not_enabled" | "subscription_expired" | "enabled";

const copy: Record<Status, string> = {
  checking: "Checking notification support…",
  unsupported: "Browser push notifications are not supported on this device. You will still receive notifications inside your TheFitSaathi dashboard.",
  insecure: "Browser notifications require HTTPS. Localhost is supported during development.",
  service_worker_unavailable: "The notification service worker is unavailable. You will still receive in-app notifications.",
  vapid_unavailable: "Browser push is not configured on this TheFitSaathi deployment.",
  denied: "Notifications are blocked in your browser. Open your browser’s site settings and allow notifications for TheFitSaathi.",
  not_enabled: "Notifications are not enabled on this device.",
  subscription_expired: "Notification permission exists, but this device subscription is missing or expired. Enable it again.",
  enabled: "Booking notifications are enabled on this device.",
};

export function NotificationPermissionCard({ audience = "provider" }: { audience?: "provider" | "customer" }) {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  const detect = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("PushManager" in window)) return setStatus("unsupported");
    if (!("serviceWorker" in navigator)) return setStatus("service_worker_unavailable");
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return setStatus("insecure");
    if (!publicKey) return setStatus("vapid_unavailable");
    if (Notification.permission === "denied") return setStatus("denied");
    if (Notification.permission === "default") return setStatus("not_enabled");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return setStatus("subscription_expired");
      const endpointHash = await sha256(subscription.endpoint);
      const server = await localApi<{ deviceRegistered: boolean; serverConfigured: boolean }>(`/push/status?endpointHash=${endpointHash}`);
      setStatus(!server.serverConfigured ? "vapid_unavailable" : server.deviceRegistered ? "enabled" : "subscription_expired");
    } catch {
      setStatus("service_worker_unavailable");
    }
  }, [publicKey]);

  useEffect(() => { void detect(); }, [detect]);

  async function enable() {
    if (busy || status === "denied") return;
    setBusy(true);
    setMessage("");
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission === "denied") { setStatus("denied"); return; }
      if (permission !== "granted") { setStatus("not_enabled"); return; }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const json = subscription.toJSON();
      await localApi("/push/subscribe", { method: "POST", body: JSON.stringify({ ...json, deviceName: (navigator.userAgentData?.platform || "This device").slice(0, 100), browserName: navigator.userAgent.slice(0, 100), platform: navigator.platform.slice(0, 100) }) });
      setStatus("enabled");
      setMessage("Booking notifications are enabled on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Push notifications could not be enabled.");
      await detect();
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await localApi("/push/unsubscribe", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setStatus("not_enabled");
      setMessage("Notifications were disabled on this device.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Notifications could not be disabled."); }
    finally { setBusy(false); }
  }

  async function test() {
    setBusy(true);
    setMessage("");
    try {
      const result = await localApi<{ delivered: number }>("/push/test", { method: "POST" });
      setMessage(`Test notification sent to ${result.delivered} device${result.delivered === 1 ? "" : "s"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The test notification could not be sent."); }
    finally { setBusy(false); }
  }

  return (
    <section id="notification-settings" className="rounded-2xl border border-acid/20 bg-acid/[.06] p-5 sm:p-6">
      <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-acid text-ink">{status === "denied" ? <BellOff /> : <BellRing />}</div><div><h2 className="text-xl font-bold text-white">{audience === "provider" ? "Never miss a new booking" : "Stay updated on your bookings"}</h2><p className="mt-2 text-sm leading-6 text-zinc-300">{audience === "provider" ? "Enable browser notifications to receive instant alerts when a customer books your coaching, dojo, or gym." : "Enable browser notifications to receive booking status updates."}</p><p className="mt-2 text-sm font-medium text-acid">{copy[status]}</p></div></div>
      <div className="mt-5 flex flex-wrap gap-2">
        {status !== "enabled" ? <button type="button" onClick={enable} disabled={busy || ["denied", "unsupported", "insecure", "service_worker_unavailable", "vapid_unavailable", "checking"].includes(status)} className="rounded-full bg-acid px-4 py-2.5 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Working…" : "Enable booking notifications"}</button> : <button type="button" onClick={disable} disabled={busy} className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white">Disable on this device</button>}
        <button type="button" onClick={test} disabled={busy || status !== "enabled"} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Send className="h-4 w-4" />Send test notification</button>
        <button type="button" onClick={() => setMessage(copy[status])} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white"><Settings className="h-4 w-4" />Notification settings</button>
      </div>
      {message ? <p role="status" className="mt-4 text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

declare global { interface Navigator { userAgentData?: { platform?: string } } }
