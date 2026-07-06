"use client";

import { CheckCircle2, Copy, Smartphone } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { MANUAL_UPI_ID } from "@/lib/manual-upi";

type ManualUpiPaymentProps = {
  amountLabel?: string;
  transactionName?: string;
  screenshotName?: string;
  showScreenshot?: boolean;
  className?: string;
};

export function ManualUpiPayment({
  amountLabel,
  transactionName = "transactionId",
  screenshotName = "paymentScreenshot",
  showScreenshot = true,
  className = ""
}: ManualUpiPaymentProps) {
  const [copied, setCopied] = useState(false);

  async function copyUpiId() {
    await navigator.clipboard.writeText(MANUAL_UPI_ID);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className={`rounded-2xl border border-acid/25 bg-acid/10 p-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Smartphone className="h-4 w-4 text-acid" />
            Pay with PhonePe / UPI
          </p>
          {amountLabel ? <p className="mt-2 text-2xl font-bold text-white">{amountLabel}</p> : null}
          <p className="mt-2 text-xs leading-5 text-zinc-300">Scan the QR or pay to the UPI ID, then enter the transaction ID below.</p>
        </div>
        <div className="mx-auto aspect-[538/552] w-full max-w-64 overflow-hidden rounded-lg border-4 border-white bg-white shadow-xl" aria-label="PhonePe UPI scanner QR">
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src="/payments/phonepe-upi-qr-source.png"
              alt="PhonePe scanner QR for FitSaathi payment"
              width={1366}
              height={768}
              unoptimized
              className="pointer-events-none absolute max-w-none select-none"
              style={{ width: "253.9%", height: "auto", left: "-76.95%", top: "-30.43%" }}
            />
          </div>
        </div>
        <div className="min-w-0 rounded-xl border border-white/10 bg-ink/70 p-3">
          <p className="text-xs uppercase tracking-[.16em] text-zinc-500">UPI ID</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm font-semibold text-white">{MANUAL_UPI_ID}</code>
            <button
              type="button"
              onClick={copyUpiId}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-200 transition hover:border-acid/50 hover:text-acid"
              aria-label="Copy UPI ID"
              title="Copy UPI ID"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-acid" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      <input type="hidden" name="paymentMethod" value="upi_manual" />
      <input type="hidden" name="upiId" value={MANUAL_UPI_ID} />
      <label className="mt-4 block text-sm font-medium text-white">
        Enter UPI Transaction ID
        <input
          name={transactionName}
          required
          minLength={6}
          maxLength={80}
          placeholder="Example: UPI123456789"
          className="field mt-2"
        />
      </label>
      {showScreenshot ? (
        <label className="mt-3 block rounded-xl border border-white/10 bg-ink/70 px-4 py-3 text-sm text-zinc-300">
          <span className="block font-medium text-white">Upload payment screenshot (optional)</span>
          <input
            name={screenshotName}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-acid file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink"
          />
        </label>
      ) : null}
    </section>
  );
}
