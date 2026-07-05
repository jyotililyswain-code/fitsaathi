"use client";

import { QrCode, ScanLine } from "lucide-react";
import { useState } from "react";
import { useSessionUser } from "@/lib/auth-client";

export default function AttendancePage() {
  const { user } = useSessionUser();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");

  function authHeaders() {
    if (!user) throw new Error("Please sign in first.");
    return { "Content-Type": "application/json" };
  }

  async function generateToken() {
    setMessage("");
    if (!bookingId.trim()) return setMessage("Enter an accepted booking ID.");
    const response = await fetch("/api/attendance/token", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ bookingId: bookingId.trim() })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Could not generate QR.");
      return;
    }
    setToken(data.token);
    setMessage("Temporary attendance QR generated for 2 minutes.");
  }

  async function scanToken() {
    const response = await fetch("/api/attendance/scan", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    setMessage(response.ok ? `Attendance marked: ${data.attendanceId}` : data.error || "Attendance scan failed.");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white">QR attendance</h1>
      <p className="mt-3 text-zinc-400">Generate a short-lived class QR, then scan it to validate booking, customer, coach, expiry, duplicate use, and class timing.</p>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <input value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="Accepted booking ID" className="field mb-4" />
        <div className="flex flex-wrap gap-3">
          <button onClick={generateToken} className="inline-flex items-center gap-2 rounded-xl bg-acid px-5 py-3 font-semibold text-ink">
            <QrCode className="h-5 w-5" />
            Generate QR
          </button>
          <button disabled={!token} onClick={scanToken} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:text-zinc-600">
            <ScanLine className="h-5 w-5" />
            Scan QR
          </button>
        </div>
        {token ? <code className="mt-5 block break-all rounded-xl border border-white/10 bg-ink p-4 text-xs text-zinc-300">{token}</code> : null}
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </div>
    </main>
  );
}
