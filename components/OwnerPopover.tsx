"use client";

import { ChevronDown, Crown, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function OwnerPopover() {
  const [open, setOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowAdmin(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setShowAdmin(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => {
            if (value) setShowAdmin(false);
            return !value;
          });
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="owner-popover"
        aria-label="Owner"
        title="Owner"
        className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-acid/30 bg-acid/[0.08] px-3 text-xs font-semibold text-acid shadow-[0_0_20px_rgba(0,255,136,0.08)] transition duration-200 hover:border-acid/60 hover:bg-acid/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:px-4 sm:text-sm"
      >
        <Crown className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden min-[360px]:inline">Owner</span>
      </button>

      <div
        id="owner-popover"
        role="dialog"
        aria-modal="false"
        aria-labelledby="owner-popover-title"
        aria-hidden={!open}
        className={`absolute right-0 top-full z-[60] mt-3 w-[min(19rem,calc(100vw-2rem))] origin-top-right rounded-lg border border-white/10 bg-zinc-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-200 ease-out ${open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none"}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-acid/20 bg-acid/10 text-acid">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p id="owner-popover-title" className="text-xs font-semibold uppercase tracking-[0.18em] text-acid">FitSaathi Owner</p>
            <p className="mt-1 text-sm text-zinc-400">Owner Name:</p>
            <p className="text-base font-semibold text-white">Priyanshu Swain</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdmin((value) => !value)}
          aria-expanded={showAdmin}
          aria-controls="owner-admin-details"
          className="mt-4 flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-sm font-semibold text-white transition hover:border-acid/40 hover:bg-acid/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-acid">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="flex-1">Admin</span>
          <ChevronDown className={`h-4 w-4 text-zinc-400 transition ${showAdmin ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        <div
          id="owner-admin-details"
          aria-hidden={!showAdmin}
          className={`grid transition-all duration-200 ${showAdmin ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-acid/20 bg-acid/[0.06] px-4 py-3">
              <p className="text-xs text-zinc-400">Admin Name:</p>
              <p className="mt-0.5 font-semibold text-white">Parthsaarthi</p>
            </div>
          </div>
        </div>

        <Link href="/admin/social" onClick={() => setOpen(false)} className="mt-3 block rounded-lg border border-acid/30 bg-acid/10 px-4 py-3 text-center text-sm font-semibold text-acid transition hover:border-acid/60 hover:bg-acid/[0.16]">
          Open owner dashboard
        </Link>
      </div>
    </div>
  );
}
