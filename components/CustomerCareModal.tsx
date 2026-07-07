"use client";

import { Headphones, Mail, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SUPPORT_EMAIL = "priyanshuswain2000@gmail.com";
const SUPPORT_PHONE = "8447640449";

type CustomerCareButtonProps = {
  variant?: "header" | "menu" | "footer";
};

export function CustomerCareButton({ variant = "footer" }: CustomerCareButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  const className = variant === "header"
    ? "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-acid/30 bg-acid/[0.06] px-2.5 text-acid transition hover:border-acid/60 hover:bg-acid/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid sm:px-3"
    : variant === "menu"
      ? "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-acid/30 px-4 py-3 font-semibold text-acid transition hover:bg-acid/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
      : "inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        aria-haspopup="dialog"
        aria-label={variant === "header" ? "Customer Care" : undefined}
        title={variant === "header" ? "Customer Care" : undefined}
      >
        <Headphones className="h-4 w-4" aria-hidden="true" />
        <span className={variant === "header" ? "hidden text-sm font-semibold sm:inline" : undefined}>Customer Care</span>
      </button>
      <CustomerCareModal open={open} onClose={close} />
    </>
  );
}

export function CustomerCareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        aria-labelledby="customer-care-title"
        className="relative w-full max-w-md rounded-lg border border-acid/30 bg-zinc-950 p-6 shadow-2xl shadow-black/60 sm:p-7"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-acid/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
          aria-label="Close Customer Care"
          title="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-acid/10 text-acid">
          <Headphones className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="customer-care-title" className="mt-5 pr-12 text-2xl font-bold text-white">Customer Care</h2>
        <p className="mt-3 text-zinc-300">Need help? Contact FitSaathi support.</p>

        <div className="mt-6 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03] px-4">
          <div className="flex items-start gap-3 py-4">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-acid" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-zinc-500">Email</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block break-all text-sm font-medium text-white transition hover:text-acid">{SUPPORT_EMAIL}</a>
            </div>
          </div>
          <div className="flex items-start gap-3 py-4">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-acid" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">Phone</p>
              <a href={`tel:${SUPPORT_PHONE}`} className="mt-1 block text-sm font-medium text-white transition hover:text-acid">{SUPPORT_PHONE}</a>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-acid px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email Support
          </a>
          <a href={`tel:${SUPPORT_PHONE}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-acid/40 px-4 py-3 text-sm font-semibold text-white transition hover:bg-acid/10 hover:text-acid">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call Support
          </a>
        </div>
      </section>
    </div>
  );
}
