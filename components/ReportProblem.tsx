"use client";

import { Mail, MessageCircleWarning, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const supportEmail = "priyanshuswain2000@gmail.com";
const supportPhone = "8447640449";

type ReportProblemButtonProps = {
  variant?: "footer" | "dashboard";
};

export function ReportProblemButton({ variant = "footer" }: ReportProblemButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={variant === "dashboard"
          ? "min-h-32 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left text-white transition hover:border-acid/40 hover:bg-white/[0.06]"
          : "inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"}
        aria-haspopup="dialog"
      >
        <MessageCircleWarning className={variant === "dashboard" ? "h-6 w-6 text-acid" : "h-4 w-4"} aria-hidden="true" />
        {variant === "dashboard" ? (
          <span>
            <span className="mt-3 block text-lg font-semibold">Report a Problem</span>
            <span className="text-sm text-zinc-400">Open support</span>
          </span>
        ) : "Report a Problem"}
      </button>
      <ReportProblemModal open={open} onClose={close} />
    </>
  );
}

export function ReportProblemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-problem-title"
        className="relative w-full max-w-lg rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/60 sm:p-7"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-acid/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
          aria-label="Close support dialog"
          title="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-acid/10 text-acid">
          <MessageCircleWarning className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="report-problem-title" className="mt-5 pr-12 text-2xl font-bold text-white">Report a Problem</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          Facing any issue with a free booking, registration, coach, dojo, shop order, or account? Contact FitSaathi support using the details below.
        </p>

        <div className="mt-6 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03] px-4">
          <div className="flex items-start gap-3 py-4">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-acid" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-zinc-500">Email</p>
              <a href={`mailto:${supportEmail}`} className="mt-1 block break-all text-sm font-medium text-white hover:text-acid">{supportEmail}</a>
            </div>
          </div>
          <div className="flex items-start gap-3 py-4">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-acid" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">Phone</p>
              <a href={`tel:${supportPhone}`} className="mt-1 block text-sm font-medium text-white hover:text-acid">{supportPhone}</a>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href={`mailto:${supportEmail}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-acid px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email Support
          </a>
          <a href={`tel:${supportPhone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call Support
          </a>
        </div>
      </section>
    </div>
  );
}
